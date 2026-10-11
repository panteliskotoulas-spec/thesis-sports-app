import 'server-only';

import { TRPCError } from '@trpc/server';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import { MIN_CARD_CENTS } from '@/lib/bookings/payment-split';
import type { LocalizedText } from '@/lib/i18n-content';
import {
  teamSplitRefundedMessage,
  teamSplitRequestedMessage,
} from '@/lib/server/booking-notifications';
import { decimalToCents, money } from '@/lib/server/booking-shared';
import { getStripe } from '@/lib/server/stripe';
import type { TeamSplitSummary } from '@/lib/teams/team-split';

type Db = PrismaClient | Prisma.TransactionClient;

export function computeEqualShareCents(
  totalCents: number,
  participants: number,
): number {
  if (participants < 2) return 0;
  return Math.floor(totalCents / participants);
}

export interface CreateSplitsParams {
  reservationId: string;
  teamId: string;
  teamName: string;
  payerId: string;
  payerName: string;
  totalCents: number;
  fieldName: LocalizedText;
  startTime: Date;
  endTime: Date;
}

export async function createReservationSplits(
  tx: Prisma.TransactionClient,
  params: CreateSplitsParams,
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

  await tx.paymentSplit.createMany({
    data: members.map((member) => ({
      reservationId: params.reservationId,
      userId: member.userId,
      amount: money(shareCents),
      status: 'PENDING' as const,
    })),
  });

  const message = teamSplitRequestedMessage(
    params.teamName,
    params.fieldName,
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
      linkUrl: `/teams/${params.teamId}/split/${params.reservationId}`,
    })),
  });

  return members.map((member) => member.userId);
}

export interface SettleSplitsParams {
  reservationId: string;
  teamId: string;
  teamName: string;
  fieldName: LocalizedText;
  startTime: Date;
  endTime: Date;
}

export async function settleSplitsOnCancel(
  tx: Prisma.TransactionClient,
  params: SettleSplitsParams,
): Promise<{ receivedCents: number; refundedUserIds: string[] }> {
  const splits = await tx.paymentSplit.findMany({
    where: {
      reservationId: params.reservationId,
      status: { in: ['PENDING', 'PAID'] },
    },
    select: { id: true, userId: true, amount: true, status: true },
  });

  if (splits.length === 0) return { receivedCents: 0, refundedUserIds: [] };

  const pendingIds = splits
    .filter((split) => split.status === 'PENDING')
    .map((split) => split.id);

  if (pendingIds.length > 0) {
    await tx.paymentSplit.updateMany({
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
          relatedReservationId: params.reservationId,
        },
      });
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' },
    });

    await tx.paymentSplit.update({
      where: { id: split.id },
      data: { status: 'REFUNDED' },
    });

    const outcome =
      cardCents === 0 ? 'credit' : creditCents > 0 ? 'mixed' : 'card';

    await tx.notification.create({
      data: {
        userId: split.userId,
        type: 'TEAM_RESERVATION_CANCELLED',
        message: teamSplitRefundedMessage(
          params.teamName,
          params.fieldName,
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
        { idempotencyKey: `refund-split-${split.id}` },
      );
    }
  }

  return { receivedCents, refundedUserIds };
}

export async function cancelPendingSplitsForMember(
  db: Db,
  teamId: string,
  userId: string,
): Promise<void> {
  const reservations = await db.reservation.findMany({
    where: { teamId },
    select: { id: true },
  });
  if (reservations.length === 0) return;

  await db.paymentSplit.updateMany({
    where: {
      userId,
      status: 'PENDING',
      reservationId: { in: reservations.map((reservation) => reservation.id) },
    },
    data: { status: 'CANCELLED' },
  });
}

export interface SplitSummaryInput {
  id: string;
  userId: string;
  payerName: string;
}

export async function buildSplitSummaries(
  db: Db,
  params: { viewerId: string; reservations: SplitSummaryInput[] },
): Promise<Map<string, TeamSplitSummary>> {
  const summaries = new Map<string, TeamSplitSummary>();
  if (params.reservations.length === 0) return summaries;

  const ids = params.reservations.map((reservation) => reservation.id);

  const splits = await db.paymentSplit.findMany({
    where: { reservationId: { in: ids }, status: { in: ['PENDING', 'PAID'] } },
    orderBy: { createdAt: 'asc' },
    select: { reservationId: true, userId: true, amount: true, status: true },
  });
  if (splits.length === 0) return summaries;

  const [payments, users] = await Promise.all([
    db.payment.findMany({
      where: { reservationId: { in: ids }, status: 'SUCCEEDED' },
      select: { reservationId: true, amount: true },
    }),
    db.user.findMany({
      where: { id: { in: [...new Set(splits.map((split) => split.userId))] } },
      select: { id: true, name: true },
    }),
  ]);

  const totals = new Map(
    payments.map(
      (payment) => [payment.reservationId, payment.amount.toNumber()] as const,
    ),
  );
  const names = new Map(users.map((user) => [user.id, user.name] as const));

  for (const reservation of params.reservations) {
    const own = splits.filter(
      (split) => split.reservationId === reservation.id,
    );
    if (own.length === 0) continue;

    const share = own[0].amount.toNumber();

    if (reservation.userId === params.viewerId) {
      summaries.set(reservation.id, {
        viewer: 'leader',
        total: totals.get(reservation.id) ?? share * (own.length + 1),
        share,
        leaderName: reservation.payerName,
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

    summaries.set(reservation.id, {
      viewer: 'member',
      total: totals.get(reservation.id) ?? share * (own.length + 1),
      share: mine.amount.toNumber(),
      leaderName: reservation.payerName,
      myStatus: mine.status === 'PAID' ? 'PAID' : 'PENDING',
      members: [],
    });
  }

  return summaries;
}
