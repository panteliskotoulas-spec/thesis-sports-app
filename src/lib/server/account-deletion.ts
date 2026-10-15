import 'server-only';

import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import type { DeletionBlocker } from '@/lib/profile/profile';

type Db = PrismaClient | Prisma.TransactionClient;

export const ANONYMOUS_NAME = 'Ανώνυμος';

const ACTIVE_SESSION_STATUSES = ['PENDING', 'ACCEPTED', 'CONFIRMED'] as const;

export type DeletionOutcome =
  | 'ok'
  | 'blocked'
  | 'credit_not_accepted'
  | 'not_found';

export async function getDeletionBlockers(
  db: Db,
  userId: string,
  now: Date,
): Promise<DeletionBlocker[]> {
  const [
    bookings,
    sessions,
    leaderTeams,
    fieldSlots,
    coachSessions,
    reservationSplits,
    sessionSplits,
  ] = await Promise.all([
    db.reservation.count({
      where: { userId, status: 'CONFIRMED', slot: { endTime: { gt: now } } },
    }),
    db.coachingSession.count({
      where: {
        userId,
        status: { in: [...ACTIVE_SESSION_STATUSES] },
        slot: { endTime: { gt: now } },
      },
    }),
    db.teamMembership.findMany({
      where: { userId, role: 'LEADER' },
      select: { team: { select: { _count: { select: { members: true } } } } },
    }),
    db.availabilitySlot.count({
      where: {
        field: { ownerId: userId },
        startTime: { gt: now },
        OR: [
          { reservations: { some: { status: 'CONFIRMED' } } },
          { status: 'PENDING_PAYMENT', holdExpiresAt: { gt: now } },
        ],
      },
    }),
    db.coachingSession.count({
      where: {
        status: { in: [...ACTIVE_SESSION_STATUSES] },
        slot: { coach: { userId }, endTime: { gt: now } },
      },
    }),
    db.paymentSplit.findMany({
      where: { userId, status: 'PENDING' },
      select: { reservationId: true },
    }),
    db.sessionSplit.findMany({
      where: { userId, status: 'PENDING' },
      select: { coachingSessionId: true },
    }),
  ]);

  const [pendingReservationSplits, pendingSessionSplits] = await Promise.all([
    reservationSplits.length === 0
      ? 0
      : db.reservation.count({
          where: {
            id: { in: reservationSplits.map((split) => split.reservationId) },
            status: 'CONFIRMED',
            slot: { endTime: { gt: now } },
          },
        }),
    sessionSplits.length === 0
      ? 0
      : db.coachingSession.count({
          where: {
            id: { in: sessionSplits.map((split) => split.coachingSessionId) },
            status: 'CONFIRMED',
            slot: { endTime: { gt: now } },
          },
        }),
  ]);

  const leaderWithMembers = leaderTeams.filter(
    (membership) => membership.team._count.members > 1,
  ).length;

  const candidates: DeletionBlocker[] = [
    { kind: 'UPCOMING_BOOKINGS', count: bookings },
    { kind: 'UPCOMING_SESSIONS', count: sessions },
    { kind: 'TEAM_LEADER', count: leaderWithMembers },
    { kind: 'OWNED_FIELD_BOOKINGS', count: fieldSlots },
    { kind: 'COACH_SESSIONS', count: coachSessions },
    {
      kind: 'PENDING_SPLITS',
      count: pendingReservationSplits + pendingSessionSplits,
    },
  ];

  return candidates.filter((blocker) => blocker.count > 0);
}

export async function getDeletionStatus(db: Db, userId: string) {
  const [blockers, user] = await Promise.all([
    getDeletionBlockers(db, userId, new Date()),
    db.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true },
    }),
  ]);

  return {
    status: 'ok' as const,
    blockers,
    creditBalance: user ? user.creditBalance.toNumber() : 0,
  };
}

async function removeTeamConversation(
  tx: Prisma.TransactionClient,
  teamId: string,
): Promise<void> {
  const conversation = await tx.conversation.findUnique({
    where: { teamId },
    select: { id: true },
  });
  if (!conversation) return;

  await tx.message.deleteMany({ where: { conversationId: conversation.id } });
  await tx.conversationRead.deleteMany({
    where: { conversationId: conversation.id },
  });
  await tx.conversation.delete({ where: { id: conversation.id } });
}

export async function anonymizeAccount(
  tx: Prisma.TransactionClient,
  params: { userId: string; acceptCreditLoss: boolean },
): Promise<DeletionOutcome> {
  const { userId } = params;
  const now = new Date();

  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { email: true, creditBalance: true },
  });
  if (!user) return 'not_found';

  const blockers = await getDeletionBlockers(tx, userId, now);
  if (blockers.length > 0) return 'blocked';

  if (user.creditBalance.toNumber() > 0 && !params.acceptCreditLoss) {
    return 'credit_not_accepted';
  }

  await tx.paymentSplit.updateMany({
    where: { userId, status: 'PENDING' },
    data: { status: 'CANCELLED' },
  });
  await tx.sessionSplit.updateMany({
    where: { userId, status: 'PENDING' },
    data: { status: 'CANCELLED' },
  });

  const memberships = await tx.teamMembership.findMany({
    where: { userId },
    select: {
      teamId: true,
      role: true,
      team: {
        select: {
          _count: {
            select: {
              reservations: true,
              tournamentTeams: true,
              coachingSessions: true,
            },
          },
        },
      },
    },
  });

  for (const membership of memberships) {
    const counts = membership.team._count;
    const hasHistory =
      counts.reservations + counts.tournamentTeams + counts.coachingSessions >
      0;

    if (membership.role === 'LEADER' && !hasHistory) {
      await removeTeamConversation(tx, membership.teamId);
      await tx.team.delete({ where: { id: membership.teamId } });
      continue;
    }

    await tx.teamMembership.deleteMany({
      where: { teamId: membership.teamId, userId },
    });

    if (membership.role === 'LEADER') {
      await tx.team.update({
        where: { id: membership.teamId },
        data: { isRecruiting: false },
      });
    }
  }

  await tx.joinRequest.updateMany({
    where: { userId, status: 'PENDING' },
    data: { status: 'CANCELLED' },
  });

  await tx.message.deleteMany({ where: { senderId: userId } });
  await tx.conversationRead.deleteMany({ where: { userId } });
  await tx.notification.deleteMany({ where: { userId } });

  await tx.field.updateMany({
    where: { ownerId: userId, archivedAt: null },
    data: { archivedAt: now },
  });

  const coach = await tx.coach.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (coach) {
    await tx.coachAvailabilitySlot.deleteMany({
      where: { coachId: coach.id, status: 'OPEN', sessions: { none: {} } },
    });
    await tx.coach.update({
      where: { id: coach.id },
      data: {
        status: 'REJECTED',
        bio: {},
        area: {},
        certifications: null,
      },
    });
  }

  await tx.session.deleteMany({ where: { userId } });
  await tx.account.deleteMany({ where: { userId } });
  await tx.verification.deleteMany({ where: { identifier: user.email } });

  await tx.user.update({
    where: { id: userId },
    data: {
      name: ANONYMOUS_NAME,
      email: `deleted-${userId}@deleted.invalid`,
      emailVerified: false,
      image: null,
      businessName: null,
      taxId: null,
      stripeConnectAccountId: null,
      creditBalance: 0,
      isAdmin: false,
    },
  });

  return 'ok';
}
