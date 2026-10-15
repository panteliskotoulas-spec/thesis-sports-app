import 'server-only';

import { TRPCError } from '@trpc/server';
import type Stripe from 'stripe';
import type { PrismaClient } from '@/generated/prisma/client';
import { computePaymentSplit } from '@/lib/bookings/payment-split';
import { formatDayChip, formatTimeRange } from '@/lib/fields/detail-format';
import { todayInAthens } from '@/lib/fields/filters';
import {
  AlreadyHandled,
  BookingAbort,
  CHECKOUT_EXPIRES_MINUTES,
  decimalToCents,
  money,
  SLOT_HOLD_MINUTES,
} from '@/lib/server/booking-shared';
import { expireStaleCoachSessions } from '@/lib/server/coach-session';
import {
  sessionPaidCoachMessage,
  sessionPaidMessage,
} from '@/lib/server/coach-session-notifications';
import { createSessionSplits } from '@/lib/server/session-split';
import { getAppUrl, getStripe } from '@/lib/server/stripe';

export interface StartSessionCheckoutParams {
  userId: string;
  userEmail: string;
  sessionId: string;
  useCredit: boolean;
  lng: 'el' | 'en';
}

export type ConfirmSessionResult =
  | { status: 'confirmed' }
  | { status: 'pending' }
  | { status: 'refunded' }
  | { status: 'invalid' };

function paymentIntentId(session: Stripe.Checkout.Session): string | null {
  const intent = session.payment_intent;
  if (typeof intent === 'string') return intent;
  return intent?.id ?? null;
}

async function refundSession(
  session: Stripe.Checkout.Session,
  paymentId: string,
): Promise<void> {
  const intent = paymentIntentId(session);
  if (!intent) throw new Error('Paid session without payment intent');

  await getStripe().refunds.create(
    { payment_intent: intent },
    { idempotencyKey: `refund-payment-${paymentId}` },
  );
}

export async function releaseCoachPayment(
  prisma: PrismaClient,
  paymentId: string,
): Promise<void> {
  await prisma.payment.updateMany({
    where: { id: paymentId, status: 'PENDING' },
    data: { status: 'FAILED' },
  });
}

export async function confirmCoachCheckoutSession(
  prisma: PrismaClient,
  stripeSessionId: string,
): Promise<ConfirmSessionResult> {
  const session = await getStripe().checkout.sessions.retrieve(stripeSessionId);

  const paymentId = session.metadata?.paymentId;
  if (!paymentId || !session.metadata?.coachingSessionId) {
    return { status: 'invalid' };
  }

  if (session.payment_status !== 'paid') {
    return { status: session.status === 'expired' ? 'invalid' : 'pending' };
  }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

  if (!payment || !payment.coachingSessionId || !payment.userId) {
    return { status: 'invalid' };
  }
  if (payment.sessionId !== session.id) return { status: 'invalid' };
  if (session.metadata.userId !== payment.userId) return { status: 'invalid' };
  if (session.metadata.coachingSessionId !== payment.coachingSessionId) {
    return { status: 'invalid' };
  }

  const creditCents = decimalToCents(payment.creditApplied);
  const cardCents = decimalToCents(payment.amount) - creditCents;
  if (session.amount_total !== cardCents) return { status: 'invalid' };

  if (payment.status === 'SUCCEEDED') return { status: 'confirmed' };
  if (payment.status === 'REFUNDED') return { status: 'refunded' };

  if (payment.status === 'FAILED') {
    await refundSession(session, payment.id);
    return { status: 'refunded' };
  }

  const coaching = await prisma.coachingSession.findUnique({
    where: { id: payment.coachingSessionId },
    select: {
      slotId: true,
      teamId: true,
      price: true,
      team: { select: { name: true } },
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

  if (!coaching) {
    await refundSession(session, payment.id);
    await releaseCoachPayment(prisma, payment.id);
    return { status: 'refunded' };
  }

  const coachingSessionId = payment.coachingSessionId;
  const userId = payment.userId;

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.payment.updateMany({
        where: { id: payment.id, status: 'PENDING' },
        data: {
          status: 'SUCCEEDED',
          stripePaymentIntentId: paymentIntentId(session),
        },
      });
      if (claimed.count === 0) throw new AlreadyHandled();

      const confirmed = await tx.coachingSession.updateMany({
        where: { id: coachingSessionId, status: 'ACCEPTED' },
        data: { status: 'CONFIRMED', paidAt: new Date() },
      });
      if (confirmed.count === 0) throw new BookingAbort('slot_lost');

      const booked = await tx.coachAvailabilitySlot.updateMany({
        where: { id: coaching.slotId, status: 'PENDING_APPROVAL' },
        data: { status: 'BOOKED' },
      });
      if (booked.count === 0) throw new BookingAbort('slot_lost');

      if (creditCents > 0) {
        const charged = await tx.user.updateMany({
          where: { id: userId, creditBalance: { gte: money(creditCents) } },
          data: { creditBalance: { decrement: money(creditCents) } },
        });
        if (charged.count === 0) throw new BookingAbort('credit_short');

        await tx.creditTransaction.create({
          data: {
            userId,
            amount: money(-creditCents),
            type: 'SPENT_ON_BOOKING',
            relatedCoachingSessionId: coachingSessionId,
          },
        });
      }

      await tx.notification.create({
        data: {
          userId,
          type: 'RESERVATION_CONFIRMED',
          message: sessionPaidMessage(
            coaching.slot.coach.user.name,
            coaching.slot.startTime,
            coaching.slot.endTime,
          ),
          linkUrl: '/coaching',
        },
      });

      await tx.notification.create({
        data: {
          userId: coaching.slot.coach.userId,
          type: 'PAYOUT_RECEIVED',
          message: sessionPaidCoachMessage(
            coaching.user.name,
            coaching.slot.startTime,
            coaching.slot.endTime,
          ),
          linkUrl: '/coaches/requests',
        },
      });

      if (coaching.teamId && coaching.team) {
        await createSessionSplits(tx, {
          coachingSessionId,
          teamId: coaching.teamId,
          teamName: coaching.team.name,
          payerId: userId,
          payerName: coaching.user.name,
          coachName: coaching.slot.coach.user.name,
          totalCents: decimalToCents(coaching.price),
          startTime: coaching.slot.startTime,
          endTime: coaching.slot.endTime,
        });
      }
    });

    return { status: 'confirmed' };
  } catch (error) {
    if (error instanceof AlreadyHandled) {
      return confirmCoachCheckoutSession(prisma, stripeSessionId);
    }

    if (error instanceof BookingAbort) {
      await refundSession(session, payment.id);
      await releaseCoachPayment(prisma, payment.id);
      return { status: 'refunded' };
    }

    throw error;
  }
}

export async function abandonCoachPayment(
  prisma: PrismaClient,
  payment: { id: string; sessionId: string | null },
): Promise<'confirmed' | 'released'> {
  if (payment.sessionId) {
    const stripe = getStripe();

    try {
      await stripe.checkout.sessions.expire(payment.sessionId);
    } catch {
      const session = await stripe.checkout.sessions.retrieve(
        payment.sessionId,
      );

      if (session.status === 'complete') {
        const result = await confirmCoachCheckoutSession(
          prisma,
          payment.sessionId,
        );
        return result.status === 'confirmed' ? 'confirmed' : 'released';
      }
    }
  }

  await releaseCoachPayment(prisma, payment.id);
  return 'released';
}

export async function startCoachSessionCheckout(
  prisma: PrismaClient,
  params: StartSessionCheckoutParams,
): Promise<{ url: string | null }> {
  await expireStaleCoachSessions(prisma);

  const now = new Date();

  const coaching = await prisma.coachingSession.findFirst({
    where: { id: params.sessionId, userId: params.userId },
    select: {
      id: true,
      status: true,
      slotId: true,
      price: true,
      payBy: true,
      teamId: true,
      team: { select: { name: true } },
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

  if (!coaching) throw new TRPCError({ code: 'NOT_FOUND' });
  if (coaching.status !== 'ACCEPTED') throw new TRPCError({ code: 'CONFLICT' });
  if (!coaching.payBy || coaching.payBy <= now) {
    throw new TRPCError({ code: 'CONFLICT' });
  }
  if (coaching.slot.startTime <= now) throw new TRPCError({ code: 'CONFLICT' });

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { creditBalance: true },
  });
  if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });

  const priceCents = decimalToCents(coaching.price);
  const split = computePaymentSplit(
    priceCents,
    decimalToCents(user.creditBalance),
    params.useCredit,
  );

  if (!split.valid) throw new TRPCError({ code: 'BAD_REQUEST' });

  const previous = await prisma.payment.findMany({
    where: {
      userId: params.userId,
      coachingSessionId: coaching.id,
      status: 'PENDING',
    },
    select: { id: true, sessionId: true },
  });

  for (const payment of previous) {
    const outcome = await abandonCoachPayment(prisma, payment);
    if (outcome === 'confirmed') return { url: null };
  }

  const coachName = coaching.slot.coach.user.name;

  if (split.cardCents === 0) {
    await prisma.$transaction(async (tx) => {
      const confirmed = await tx.coachingSession.updateMany({
        where: { id: coaching.id, status: 'ACCEPTED', payBy: { gt: now } },
        data: { status: 'CONFIRMED', paidAt: now },
      });
      if (confirmed.count === 0) throw new TRPCError({ code: 'CONFLICT' });

      const booked = await tx.coachAvailabilitySlot.updateMany({
        where: { id: coaching.slotId, status: 'PENDING_APPROVAL' },
        data: { status: 'BOOKED' },
      });
      if (booked.count === 0) throw new TRPCError({ code: 'CONFLICT' });

      const charged = await tx.user.updateMany({
        where: {
          id: params.userId,
          creditBalance: { gte: money(split.creditCents) },
        },
        data: { creditBalance: { decrement: money(split.creditCents) } },
      });
      if (charged.count === 0) throw new TRPCError({ code: 'BAD_REQUEST' });

      await tx.payment.create({
        data: {
          coachingSessionId: coaching.id,
          userId: params.userId,
          amount: money(priceCents),
          platformFee: 0,
          ownerPayout: money(priceCents),
          method: 'CREDIT',
          creditApplied: money(split.creditCents),
          status: 'SUCCEEDED',
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: params.userId,
          amount: money(-split.creditCents),
          type: 'SPENT_ON_BOOKING',
          relatedCoachingSessionId: coaching.id,
        },
      });

      await tx.notification.create({
        data: {
          userId: params.userId,
          type: 'RESERVATION_CONFIRMED',
          message: sessionPaidMessage(
            coachName,
            coaching.slot.startTime,
            coaching.slot.endTime,
          ),
          linkUrl: '/coaching',
        },
      });

      await tx.notification.create({
        data: {
          userId: coaching.slot.coach.userId,
          type: 'PAYOUT_RECEIVED',
          message: sessionPaidCoachMessage(
            coaching.user.name,
            coaching.slot.startTime,
            coaching.slot.endTime,
          ),
          linkUrl: '/coaches/requests',
        },
      });

      if (coaching.teamId && coaching.team) {
        await createSessionSplits(tx, {
          coachingSessionId: coaching.id,
          teamId: coaching.teamId,
          teamName: coaching.team.name,
          payerId: params.userId,
          payerName: coaching.user.name,
          coachName,
          totalCents: priceCents,
          startTime: coaching.slot.startTime,
          endTime: coaching.slot.endTime,
        });
      }
    });

    return { url: null };
  }

  const holdExpiresAt = new Date(now.getTime() + SLOT_HOLD_MINUTES * 60_000);

  const payment = await prisma.payment.create({
    data: {
      coachingSessionId: coaching.id,
      userId: params.userId,
      holdExpiresAt,
      amount: money(priceCents),
      platformFee: 0,
      ownerPayout: money(priceCents),
      method: split.method,
      creditApplied: money(split.creditCents),
      status: 'PENDING',
    },
    select: { id: true },
  });

  const day = todayInAthens(coaching.slot.startTime);
  const description = `${formatDayChip(day, params.lng).full}, ${formatTimeRange(coaching.slot.startTime, coaching.slot.endTime, params.lng)}`;
  const base = getAppUrl();

  let stripeSessionId: string | null = null;

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      locale: params.lng,
      customer_email: params.userEmail,
      client_reference_id: payment.id,
      expires_at: Math.floor(
        (Date.now() + CHECKOUT_EXPIRES_MINUTES * 60_000) / 1000,
      ),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: split.cardCents,
            product_data: { name: coachName, description },
          },
        },
      ],
      metadata: {
        paymentId: payment.id,
        coachingSessionId: coaching.id,
        userId: params.userId,
      },
      success_url: `${base}/api/stripe/return?status=success&kind=coaching&session_id={CHECKOUT_SESSION_ID}&lng=${params.lng}`,
      cancel_url: `${base}/api/stripe/return?status=cancelled&kind=coaching&payment=${payment.id}&lng=${params.lng}`,
    });

    stripeSessionId = session.id;

    await prisma.payment.update({
      where: { id: payment.id },
      data: { sessionId: session.id },
    });

    if (!session.url) throw new Error('Checkout session without url');

    return { url: session.url };
  } catch (error) {
    if (stripeSessionId) {
      await getStripe()
        .checkout.sessions.expire(stripeSessionId)
        .catch(() => undefined);
    }
    await releaseCoachPayment(prisma, payment.id);
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', cause: error });
  }
}
