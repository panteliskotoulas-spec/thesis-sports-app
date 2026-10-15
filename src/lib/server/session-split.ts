import 'server-only';

import { TRPCError } from '@trpc/server';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import { MIN_CARD_CENTS } from '@/lib/bookings/payment-split';
import { decimalToCents, money } from '@/lib/server/booking-shared';
import {
  sessionSplitRefundedMessage,
  sessionSplitRequestedMessage,
} from '@/lib/server/coach-session-notifications';
import { getStripe } from '@/lib/server/stripe';
import { computeEqualShareCents } from '@/lib/server/team-split';
import type { TeamSplitSummary } from '@/lib/teams/team-split';

type Db = PrismaClient | Prisma.TransactionClient;

export interface CreateSessionSplitsParams {
  coachingSessionId: string;
  teamId: string;
  teamName: string;
  payerId: string;
  payerName: string;
  coachName: string;
  totalCents: number;
  startTime: Date;
  endTime: Date;
}

export async function createSessionSplits(
  tx: Prisma.TransactionClient,
  params: CreateSessionSplitsParams,
): Promise<string[]> {
  const members = await tx.teamMembership.findMany({
    where: { teamId: params.teamId, userId: { not: params.payerId } },
    select: { userId: true },
  });

  const shareCents = computeEqualShareCents(
    params.totalCents,
    members.length + 1,
  );
  if (members.length === 0 || shareCents < MIN_CARD_CENTS) return [];

  await tx.sessionSplit.createMany({
    data: members.map((member) => ({
      coachingSessionId: params.coachingSessionId,
      userId: member.userId,
      amount: money(shareCents),
      status: 'PENDING' as const,
    })),
  });

  const message = sessionSplitRequestedMessage(
    params.teamName,
    params.coachName,
    params.payerName,
    shareCents,
    params.startTime,
    params.endTime,
  );

  await tx.notification.createMany({
    data: members.map((member) => ({
      userId: member.userId,
      type: 'PAYMENT_SPLIT_REQUESTED' as const,
      message,
      linkUrl: `/teams/${params.teamId}/session-split/${params.coachingSessionId}`,
    })),
  });

  return members.map((member) => member.userId);
}

export interface SettleSessionSplitsParams {
  coachingSessionId: string;
  teamId: string;
  teamName: string;
  coachName: string;
  startTime: Date;
  endTime: Date;
}

export async function settleSessionSplitsOnCancel(
  tx: Prisma.TransactionClient,
  params: SettleSessionSplitsParams,
): Promise<{ receivedCents: number; refundedUserIds: string[] }> {
  const splits = await tx.sessionSplit.findMany({
    where: {
      coachingSessionId: params.coachingSessionId,
      status: { in: ['PENDING', 'PAID'] },
    },
    select: { id: true, userId: true, status: true },
  });

  if (splits.length === 0) return { receivedCents: 0, refundedUserIds: [] };

  const pendingIds = splits
    .filter((split) => split.status === 'PENDING')
    .map((split) => split.id);

  if (pendingIds.length > 0) {
    await tx.sessionSplit.updateMany({
      where: { id: { in: pendingIds }, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
  }

  let receivedCents = 0;
  const refundedUserIds: string[] = [];

  for (const split of splits) {
    if (split.status !== 'PAID') continue;

    const payment = await tx.payment.findFirst({
      where: { splitId: split.id, status: 'SUCCEEDED' },
      select: {
        id: true,
        amount: true,
        creditApplied: true,
        stripePaymentIntentId: true,
      },
    });

    if (!payment) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

    const totalCents = decimalToCents(payment.amount);
    const creditCents = decimalToCents(payment.creditApplied);
    const cardCents = totalCents - creditCents;

    if (cardCents > 0 && !payment.stripePaymentIntentId) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }

    receivedCents += totalCents;
    refundedUserIds.push(split.userId);

    if (creditCents > 0) {
      await tx.user.update({
        where: { id: split.userId },
        data: { creditBalance: { increment: money(creditCents) } },
      });

      await tx.creditTransaction.create({
        data: {
          userId: split.userId,
          amount: money(creditCents),
          type: 'EARNED_FROM_CANCELLATION',
          relatedCoachingSessionId: params.coachingSessionId,
        },
      });
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' },
    });

    await tx.sessionSplit.update({
      where: { id: split.id },
      data: { status: 'REFUNDED' },
    });

    const outcome =
      cardCents === 0 ? 'credit' : creditCents > 0 ? 'mixed' : 'card';

    await tx.notification.create({
      data: {
        userId: split.userId,
        type: 'RESERVATION_CANCELLED',
        message: sessionSplitRefundedMessage(
          params.teamName,
          params.coachName,
          params.startTime,
          params.endTime,
          outcome,
        ),
        linkUrl: `/teams/${params.teamId}`,
      },
    });

    if (cardCents > 0 && payment.stripePaymentIntentId) {
      await getStripe().refunds.create(
        { payment_intent: payment.stripePaymentIntentId, amount: cardCents },
        { idempotencyKey: `refund-session-split-${split.id}` },
      );
    }
  }

  return { receivedCents, refundedUserIds };
}

export interface SessionSplitSummaryInput {
  id: string;
  userId: string;
  payerName: string;
  total: number;
}

export async function buildSessionSplitSummaries(
  db: Db,
  params: { viewerId: string; sessions: SessionSplitSummaryInput[] },
): Promise<Map<string, TeamSplitSummary>> {
  const summaries = new Map<string, TeamSplitSummary>();
  if (params.sessions.length === 0) return summaries;

  const ids = params.sessions.map((session) => session.id);

  const splits = await db.sessionSplit.findMany({
    where: {
      coachingSessionId: { in: ids },
      status: { in: ['PENDING', 'PAID'] },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      coachingSessionId: true,
      userId: true,
      amount: true,
      status: true,
    },
  });
  if (splits.length === 0) return summaries;

  const users = await db.user.findMany({
    where: { id: { in: [...new Set(splits.map((split) => split.userId))] } },
    select: { id: true, name: true },
  });
  const names = new Map(users.map((user) => [user.id, user.name] as const));

  for (const session of params.sessions) {
    const own = splits.filter(
      (split) => split.coachingSessionId === session.id,
    );
    if (own.length === 0) continue;

    const share = own[0].amount.toNumber();

    if (session.userId === params.viewerId) {
      summaries.set(session.id, {
        viewer: 'leader',
        total: session.total,
        share,
        leaderName: session.payerName,
        myStatus: null,
        members: own.map((split) => ({
          userId: split.userId,
          name: names.get(split.userId) ?? '',
          amount: split.amount.toNumber(),
          status: split.status === 'PAID' ? 'PAID' : 'PENDING',
        })),
      });
      continue;
    }

    const mine = own.find((split) => split.userId === params.viewerId);
    if (!mine) continue;

    summaries.set(session.id, {
      viewer: 'member',
      total: session.total,
      share: mine.amount.toNumber(),
      leaderName: session.payerName,
      myStatus: mine.status === 'PAID' ? 'PAID' : 'PENDING',
      members: [],
    });
  }

  return summaries;
}
