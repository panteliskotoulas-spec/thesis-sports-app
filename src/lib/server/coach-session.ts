import 'server-only';

import { TRPCError } from '@trpc/server';
import type { PrismaClient } from '@/generated/prisma/client';
import {
  canCancelBooking,
  type CompensationValue,
} from '@/lib/bookings/booking';
import {
  paymentDeadline,
  type CoachRequestPayment,
  type CoachRequestRow,
  type CoachSessionRow,
  type CoachSessionState,
} from '@/lib/coaches/coach-session';
import { decimalToCents, money } from '@/lib/server/booking-shared';
import {
  sessionAcceptedMessage,
  sessionCancelledByCoachMessage,
  sessionCancelledByCoachTeamMessage,
  sessionCancelledCoachMessage,
  sessionCancelledMessage,
  sessionExpiredCoachMessage,
  sessionExpiredMessage,
  sessionRejectedMessage,
  sessionRequestedMessage,
  type SessionCancellationOutcome,
} from '@/lib/server/coach-session-notifications';
import { getStripe } from '@/lib/server/stripe';
import { resolveBookingTeam } from '@/lib/server/team-booking';

const EXPIRE_BATCH = 50;

export async function expireStaleCoachSessions(
  prisma: PrismaClient,
): Promise<void> {
  const now = new Date();

  const stale = await prisma.coachingSession.findMany({
    where: {
      OR: [
        { status: 'PENDING', slot: { startTime: { lte: now } } },
        { status: 'ACCEPTED', payBy: { lt: now } },
      ],
    },
    take: EXPIRE_BATCH,
    select: {
      id: true,
      status: true,
      slotId: true,
      userId: true,
      user: { select: { name: true } },
      slot: {
        select: {
          startTime: true,
          endTime: true,
          coach: { select: { userId: true, user: { select: { name: true } } } },
        },
      },
    },
  });

  if (stale.length === 0) return;

  const live = await prisma.payment.findMany({
    where: {
      coachingSessionId: { in: stale.map((entry) => entry.id) },
      status: 'PENDING',
      holdExpiresAt: { gt: now },
    },
    select: { coachingSessionId: true },
  });
  const inCheckout = new Set(live.map((entry) => entry.coachingSessionId));

  for (const entry of stale) {
    if (inCheckout.has(entry.id)) continue;

    await prisma.$transaction(async (tx) => {
      const expired = await tx.coachingSession.updateMany({
        where: { id: entry.id, status: entry.status },
        data: { status: 'EXPIRED' },
      });
      if (expired.count === 0) return;

      if (entry.status !== 'ACCEPTED') return;

      await tx.coachAvailabilitySlot.updateMany({
        where: { id: entry.slotId, status: 'PENDING_APPROVAL' },
        data: { status: 'OPEN' },
      });

      await tx.notification.create({
        data: {
          userId: entry.userId,
          type: 'RESERVATION_CANCELLED',
          message: sessionExpiredMessage(
            entry.slot.coach.user.name,
            entry.slot.startTime,
            entry.slot.endTime,
          ),
          linkUrl: '/coaching',
        },
      });

      await tx.notification.create({
        data: {
          userId: entry.slot.coach.userId,
          type: 'RESERVATION_CANCELLED',
          message: sessionExpiredCoachMessage(
            entry.user.name,
            entry.slot.startTime,
            entry.slot.endTime,
          ),
          linkUrl: '/coaches/requests',
        },
      });
    });
  }
}

export interface RequestSessionParams {
  userId: string;
  slotId: string;
  teamId: string | null;
}

export async function requestSession(
  prisma: PrismaClient,
  params: RequestSessionParams,
): Promise<{ id: string }> {
  await expireStaleCoachSessions(prisma);

  const now = new Date();

  const slot = await prisma.coachAvailabilitySlot.findUnique({
    where: { id: params.slotId },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      price: true,
      coach: { select: { userId: true, status: true, sportType: true } },
    },
  });

  if (!slot || slot.coach.status !== 'APPROVED') {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }
  if (slot.coach.userId === params.userId) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  if (slot.startTime <= now) throw new TRPCError({ code: 'BAD_REQUEST' });

  const requester = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { name: true },
  });
  if (!requester) throw new TRPCError({ code: 'UNAUTHORIZED' });

  const team = params.teamId
    ? await resolveBookingTeam(prisma, {
        teamId: params.teamId,
        userId: params.userId,
        sportType: slot.coach.sportType,
      })
    : null;

  return prisma.$transaction(async (tx) => {
    const held = await tx.coachAvailabilitySlot.updateMany({
      where: { id: slot.id, status: 'OPEN', startTime: { gt: now } },
      data: { status: 'PENDING_APPROVAL' },
    });
    if (held.count === 0) throw new TRPCError({ code: 'CONFLICT' });

    const session = await tx.coachingSession.create({
      data: {
        slotId: slot.id,
        userId: params.userId,
        teamId: team?.id ?? null,
        price: slot.price,
      },
      select: { id: true },
    });

    await tx.notification.create({
      data: {
        userId: slot.coach.userId,
        type: 'COACHING_SESSION_REQUESTED',
        message: sessionRequestedMessage(
          requester.name,
          team?.name ?? null,
          slot.startTime,
          slot.endTime,
        ),
        linkUrl: '/coaches/requests',
      },
    });

    return session;
  });
}

export interface RespondParams {
  coachUserId: string;
  sessionId: string;
  decision: 'accept' | 'reject';
}

export async function respondToRequest(
  prisma: PrismaClient,
  params: RespondParams,
): Promise<{ payBy: Date | null }> {
  const now = new Date();

  const session = await prisma.coachingSession.findFirst({
    where: {
      id: params.sessionId,
      slot: { coach: { userId: params.coachUserId } },
    },
    select: {
      id: true,
      status: true,
      slotId: true,
      userId: true,
      slot: {
        select: {
          startTime: true,
          endTime: true,
          coach: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });

  if (!session) throw new TRPCError({ code: 'NOT_FOUND' });
  if (session.status !== 'PENDING') throw new TRPCError({ code: 'CONFLICT' });
  if (session.slot.startTime <= now) throw new TRPCError({ code: 'CONFLICT' });

  const coachName = session.slot.coach.user.name;

  if (params.decision === 'accept') {
    const payBy = paymentDeadline(now, session.slot.startTime);

    await prisma.$transaction(async (tx) => {
      const updated = await tx.coachingSession.updateMany({
        where: { id: session.id, status: 'PENDING' },
        data: { status: 'ACCEPTED', respondedAt: now, payBy },
      });
      if (updated.count === 0) throw new TRPCError({ code: 'CONFLICT' });

      await tx.notification.create({
        data: {
          userId: session.userId,
          type: 'COACHING_SESSION_ACCEPTED',
          message: sessionAcceptedMessage(
            coachName,
            session.slot.startTime,
            session.slot.endTime,
            payBy,
          ),
          linkUrl: '/coaching',
        },
      });
    });

    return { payBy };
  }

  await prisma.$transaction(async (tx) => {
    const updated = await tx.coachingSession.updateMany({
      where: { id: session.id, status: 'PENDING' },
      data: { status: 'REJECTED', respondedAt: now },
    });
    if (updated.count === 0) throw new TRPCError({ code: 'CONFLICT' });

    await tx.coachAvailabilitySlot.updateMany({
      where: { id: session.slotId, status: 'PENDING_APPROVAL' },
      data: { status: 'OPEN' },
    });

    await tx.notification.create({
      data: {
        userId: session.userId,
        type: 'COACHING_SESSION_REJECTED',
        message: sessionRejectedMessage(
          coachName,
          session.slot.startTime,
          session.slot.endTime,
        ),
        linkUrl: '/coaching',
      },
    });
  });

  return { payBy: null };
}

export interface CancelSessionParams {
  userId: string;
  sessionId: string;
  compensation: CompensationValue | null;
}

export async function cancelSession(
  prisma: PrismaClient,
  params: CancelSessionParams,
): Promise<{ id: string }> {
  const now = new Date();

  const session = await prisma.coachingSession.findFirst({
    where: { id: params.sessionId, userId: params.userId },
    select: {
      id: true,
      status: true,
      slotId: true,
      user: { select: { name: true } },
      slot: {
        select: {
          startTime: true,
          endTime: true,
          coach: { select: { userId: true, user: { select: { name: true } } } },
        },
      },
    },
  });

  if (!session) throw new TRPCError({ code: 'NOT_FOUND' });

  const coachName = session.slot.coach.user.name;
  const { startTime, endTime } = session.slot;
  const coachUserId = session.slot.coach.userId;

  if (session.status === 'PENDING' || session.status === 'ACCEPTED') {
    const checkout = await prisma.payment.count({
      where: {
        coachingSessionId: session.id,
        status: 'PENDING',
        holdExpiresAt: { gt: now },
      },
    });
    if (checkout > 0) throw new TRPCError({ code: 'CONFLICT' });

    await prisma.$transaction(async (tx) => {
      const updated = await tx.coachingSession.updateMany({
        where: { id: session.id, status: session.status },
        data: { status: 'CANCELLED', cancelledAt: now },
      });
      if (updated.count === 0) throw new TRPCError({ code: 'CONFLICT' });

      await tx.coachAvailabilitySlot.updateMany({
        where: { id: session.slotId, status: 'PENDING_APPROVAL' },
        data: { status: 'OPEN' },
      });

      await tx.notification.create({
        data: {
          userId: coachUserId,
          type: 'RESERVATION_CANCELLED',
          message: sessionCancelledCoachMessage(
            session.user.name,
            startTime,
            endTime,
          ),
          linkUrl: '/coaches/requests',
        },
      });
    });

    return { id: session.id };
  }

  if (session.status !== 'CONFIRMED') throw new TRPCError({ code: 'CONFLICT' });
  if (!canCancelBooking(startTime, now)) {
    throw new TRPCError({ code: 'PRECONDITION_FAILED' });
  }
  if (!params.compensation) throw new TRPCError({ code: 'BAD_REQUEST' });

  const payment = await prisma.payment.findFirst({
    where: { coachingSessionId: session.id, status: 'SUCCEEDED' },
  });
  if (!payment) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

  const totalCents = decimalToCents(payment.amount);
  const creditCents = decimalToCents(payment.creditApplied);
  const cardCents = totalCents - creditCents;

  const refund = params.compensation === 'REFUND';
  if (refund && cardCents <= 0) throw new TRPCError({ code: 'BAD_REQUEST' });
  if (refund && !payment.stripePaymentIntentId) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
  }

  const refundCents = refund ? cardCents : 0;
  const creditBackCents = refund ? creditCents : cardCents + creditCents;
  const outcome: SessionCancellationOutcome =
    refundCents === 0 ? 'credit' : creditBackCents > 0 ? 'mixed' : 'card';

  await prisma.$transaction(
    async (tx) => {
      const cancelled = await tx.coachingSession.updateMany({
        where: { id: session.id, status: 'CONFIRMED' },
        data: {
          status: 'CANCELLED',
          cancelledAt: now,
          compensationType: params.compensation,
        },
      });
      if (cancelled.count === 0) throw new TRPCError({ code: 'CONFLICT' });

      await tx.coachAvailabilitySlot.updateMany({
        where: { id: session.slotId, status: 'BOOKED' },
        data: { status: 'OPEN' },
      });

      if (creditBackCents > 0) {
        await tx.user.update({
          where: { id: params.userId },
          data: { creditBalance: { increment: money(creditBackCents) } },
        });

        await tx.creditTransaction.create({
          data: {
            userId: params.userId,
            amount: money(creditBackCents),
            type: 'EARNED_FROM_CANCELLATION',
            relatedCoachingSessionId: session.id,
          },
        });
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED' },
      });

      await tx.notification.create({
        data: {
          userId: params.userId,
          type: 'RESERVATION_CANCELLED',
          message: sessionCancelledMessage(
            coachName,
            startTime,
            endTime,
            outcome,
          ),
          linkUrl: '/coaching',
        },
      });

      await tx.notification.create({
        data: {
          userId: coachUserId,
          type: 'RESERVATION_CANCELLED',
          message: sessionCancelledCoachMessage(
            session.user.name,
            startTime,
            endTime,
          ),
          linkUrl: '/coaches/requests',
        },
      });

      if (refundCents > 0 && payment.stripePaymentIntentId) {
        await getStripe().refunds.create(
          {
            payment_intent: payment.stripePaymentIntentId,
            amount: refundCents,
          },
          { idempotencyKey: `refund-coaching-${session.id}` },
        );
      }
    },
    { timeout: 15_000 },
  );

  return { id: session.id };
}

export interface CancelSessionByCoachParams {
  coachUserId: string;
  sessionId: string;
}

export async function cancelSessionByCoach(
  prisma: PrismaClient,
  params: CancelSessionByCoachParams,
): Promise<{ id: string }> {
  const now = new Date();

  const session = await prisma.coachingSession.findFirst({
    where: {
      id: params.sessionId,
      slot: { coach: { userId: params.coachUserId } },
    },
    select: {
      id: true,
      status: true,
      userId: true,
      teamId: true,
      team: { select: { name: true } },
      slot: {
        select: {
          startTime: true,
          endTime: true,
          coach: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });

  if (!session) throw new TRPCError({ code: 'NOT_FOUND' });
  if (session.status !== 'CONFIRMED') throw new TRPCError({ code: 'CONFLICT' });
  if (session.slot.endTime <= now) throw new TRPCError({ code: 'CONFLICT' });

  const payment = await prisma.payment.findFirst({
    where: { coachingSessionId: session.id, status: 'SUCCEEDED' },
  });
  if (!payment) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

  const totalCents = decimalToCents(payment.amount);
  const creditCents = decimalToCents(payment.creditApplied);
  const cardCents = totalCents - creditCents;

  if (cardCents > 0 && !payment.stripePaymentIntentId) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
  }

  const compensation: CompensationValue = cardCents > 0 ? 'REFUND' : 'CREDIT';
  const refundCents = cardCents;
  const creditBackCents = creditCents;
  const outcome: SessionCancellationOutcome =
    refundCents === 0 ? 'credit' : creditBackCents > 0 ? 'mixed' : 'card';

  const coachName = session.slot.coach.user.name;
  const { startTime, endTime } = session.slot;

  await prisma.$transaction(
    async (tx) => {
      const cancelled = await tx.coachingSession.updateMany({
        where: { id: session.id, status: 'CONFIRMED' },
        data: {
          status: 'CANCELLED',
          cancelledAt: now,
          compensationType: compensation,
          cancelledByCoach: true,
        },
      });
      if (cancelled.count === 0) throw new TRPCError({ code: 'CONFLICT' });

      if (creditBackCents > 0) {
        await tx.user.update({
          where: { id: session.userId },
          data: { creditBalance: { increment: money(creditBackCents) } },
        });

        await tx.creditTransaction.create({
          data: {
            userId: session.userId,
            amount: money(creditBackCents),
            type: 'EARNED_FROM_CANCELLATION',
            relatedCoachingSessionId: session.id,
          },
        });
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED' },
      });

      await tx.notification.create({
        data: {
          userId: session.userId,
          type: 'RESERVATION_CANCELLED',
          message: sessionCancelledByCoachMessage(
            coachName,
            startTime,
            endTime,
            outcome,
          ),
          linkUrl: '/coaching',
        },
      });

      if (session.teamId && session.team) {
        const members = await tx.teamMembership.findMany({
          where: { teamId: session.teamId, userId: { not: session.userId } },
          select: { userId: true },
        });

        if (members.length > 0) {
          const message = sessionCancelledByCoachTeamMessage(
            coachName,
            session.team.name,
            startTime,
            endTime,
          );

          await tx.notification.createMany({
            data: members.map((member) => ({
              userId: member.userId,
              type: 'RESERVATION_CANCELLED' as const,
              message,
              linkUrl: `/teams/${session.teamId}`,
            })),
          });
        }
      }

      if (refundCents > 0 && payment.stripePaymentIntentId) {
        await getStripe().refunds.create(
          {
            payment_intent: payment.stripePaymentIntentId,
            amount: refundCents,
          },
          { idempotencyKey: `refund-coaching-${session.id}` },
        );
      }
    },
    { timeout: 15_000 },
  );

  return { id: session.id };
}

function toSessionState(status: string): CoachSessionState {
  switch (status) {
    case 'PENDING':
      return 'REQUESTED';
    case 'ACCEPTED':
      return 'AWAITING_PAYMENT';
    case 'CONFIRMED':
      return 'CONFIRMED';
    case 'REJECTED':
      return 'REJECTED';
    case 'EXPIRED':
      return 'EXPIRED';
    default:
      return 'CANCELLED';
  }
}

export async function listUserSessions(
  prisma: PrismaClient,
  userId: string,
): Promise<{ rows: CoachSessionRow[]; balance: number }> {
  await expireStaleCoachSessions(prisma);

  const [sessions, user] = await Promise.all([
    prisma.coachingSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        price: true,
        payBy: true,
        paidAt: true,
        compensationType: true,
        cancelledByCoach: true,
        team: { select: { name: true } },
        review: { select: { rating: true, comment: true } },
        slot: {
          select: {
            startTime: true,
            endTime: true,
            coach: {
              select: {
                id: true,
                sportType: true,
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true },
    }),
  ]);

  const payments =
    sessions.length === 0
      ? []
      : await prisma.payment.findMany({
          where: {
            coachingSessionId: { in: sessions.map((entry) => entry.id) },
            status: { in: ['SUCCEEDED', 'REFUNDED'] },
          },
          select: { coachingSessionId: true, creditApplied: true },
        });

  const creditBySession = new Map(
    payments.map((entry) => [
      entry.coachingSessionId,
      entry.creditApplied.toNumber(),
    ]),
  );

  const rows = sessions.map((entry) => ({
    id: entry.id,
    coachId: entry.slot.coach.id,
    coachName: entry.slot.coach.user.name,
    sportType: entry.slot.coach.sportType,
    startTime: entry.slot.startTime,
    endTime: entry.slot.endTime,
    price: entry.price.toNumber(),
    credit: creditBySession.get(entry.id) ?? 0,
    state: toSessionState(entry.status),
    payBy: entry.status === 'ACCEPTED' ? entry.payBy : null,
    wasPaid: entry.paidAt !== null,
    compensation: entry.compensationType,
    teamName: entry.team?.name ?? null,
    cancelledByCoach: entry.cancelledByCoach,
    review: entry.review ?? null,
  }));

  return { rows, balance: user ? user.creditBalance.toNumber() : 0 };
}

export async function listCoachRequests(
  prisma: PrismaClient,
  coachUserId: string,
): Promise<CoachRequestRow[]> {
  await expireStaleCoachSessions(prisma);

  const coach = await prisma.coach.findUnique({
    where: { userId: coachUserId },
    select: { id: true },
  });
  if (!coach) throw new TRPCError({ code: 'NOT_FOUND' });

  const sessions = await prisma.coachingSession.findMany({
    where: {
      slot: { coachId: coach.id },
      NOT: [{ status: 'CANCELLED' }, { status: 'EXPIRED', respondedAt: null }],
    },
    orderBy: { slot: { startTime: 'asc' } },
    select: {
      id: true,
      status: true,
      price: true,
      payBy: true,
      user: { select: { name: true } },
      team: { select: { name: true } },
      slot: { select: { startTime: true, endTime: true } },
    },
  });

  const confirmedIds = sessions
    .filter((entry) => entry.status === 'CONFIRMED')
    .map((entry) => entry.id);

  const payments =
    confirmedIds.length === 0
      ? []
      : await prisma.payment.findMany({
          where: {
            coachingSessionId: { in: confirmedIds },
            status: 'SUCCEEDED',
          },
          select: { coachingSessionId: true, creditApplied: true },
        });

  const creditBySession = new Map(
    payments.map((entry) => [
      entry.coachingSessionId,
      entry.creditApplied.toNumber(),
    ]),
  );

  return sessions.map((entry) => {
    const payment: CoachRequestPayment | null =
      entry.status === 'ACCEPTED'
        ? 'AWAITING'
        : entry.status === 'CONFIRMED'
          ? 'PAID'
          : entry.status === 'EXPIRED'
            ? 'EXPIRED'
            : null;

    return {
      id: entry.id,
      requesterName: entry.user.name,
      teamName: entry.team?.name ?? null,
      startTime: entry.slot.startTime,
      endTime: entry.slot.endTime,
      price: entry.price.toNumber(),
      state:
        entry.status === 'PENDING'
          ? 'PENDING'
          : entry.status === 'REJECTED'
            ? 'REJECTED'
            : 'ACCEPTED',
      payment,
      payBy: entry.status === 'ACCEPTED' ? entry.payBy : null,
      credit: creditBySession.get(entry.id) ?? 0,
    };
  });
}
