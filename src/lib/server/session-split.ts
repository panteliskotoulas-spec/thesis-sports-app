import 'server-only';

import type { Prisma } from '@/generated/prisma/client';
import { MIN_CARD_CENTS } from '@/lib/bookings/payment-split';
import { sessionSplitRequestedMessage } from '@/lib/server/coach-session-notifications';
import { money } from '@/lib/server/booking-shared';
import { computeEqualShareCents } from '@/lib/server/team-split';

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
