import 'server-only';

import { TRPCError } from '@trpc/server';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import type { SportType } from '@/lib/fields/types';
import type { LocalizedText } from '@/lib/i18n-content';
import {
  teamReservationCancelledMessage,
  teamReservationCreatedMessage,
} from '@/lib/server/booking-notifications';

type Db = PrismaClient | Prisma.TransactionClient;

export interface BookingTeam {
  id: string;
  name: string;
}

export async function resolveBookingTeam(
  db: Db,
  params: { teamId: string; userId: string; sportType: SportType },
): Promise<BookingTeam> {
  const membership = await db.teamMembership.findUnique({
    where: {
      teamId_userId: { teamId: params.teamId, userId: params.userId },
    },
    select: {
      role: true,
      team: { select: { id: true, name: true, sportType: true } },
    },
  });

  if (!membership || membership.role !== 'LEADER') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  if (membership.team.sportType !== params.sportType) {
    throw new TRPCError({ code: 'BAD_REQUEST' });
  }

  return { id: membership.team.id, name: membership.team.name };
}

export async function findLeaderTeam(
  db: Db,
  teamId: string,
  userId: string,
): Promise<BookingTeam | null> {
  const membership = await db.teamMembership.findFirst({
    where: { teamId, userId, role: 'LEADER' },
    select: { team: { select: { id: true, name: true } } },
  });

  return membership?.team ?? null;
}

export interface TeamReservationNoticeParams {
  teamId: string;
  teamName: string;
  excludeUserId: string;
  fieldName: LocalizedText;
  startTime: Date;
  endTime: Date;
}

export async function notifyTeamOfReservation(
  tx: Prisma.TransactionClient,
  params: TeamReservationNoticeParams & { bookerName: string },
): Promise<void> {
  const members = await tx.teamMembership.findMany({
    where: { teamId: params.teamId, userId: { not: params.excludeUserId } },
    select: { userId: true },
  });
  if (members.length === 0) return;

  const message = teamReservationCreatedMessage(
    params.teamName,
    params.fieldName,
    params.bookerName,
    params.startTime,
    params.endTime,
  );

  await tx.notification.createMany({
    data: members.map((member) => ({
      userId: member.userId,
      type: 'TEAM_RESERVATION_CREATED' as const,
      message,
      linkUrl: `/teams/${params.teamId}`,
    })),
  });
}

export async function notifyTeamOfCancellation(
  tx: Prisma.TransactionClient,
  params: TeamReservationNoticeParams,
): Promise<void> {
  const members = await tx.teamMembership.findMany({
    where: { teamId: params.teamId, userId: { not: params.excludeUserId } },
    select: { userId: true },
  });
  if (members.length === 0) return;

  const message = teamReservationCancelledMessage(
    params.teamName,
    params.fieldName,
    params.startTime,
    params.endTime,
  );

  await tx.notification.createMany({
    data: members.map((member) => ({
      userId: member.userId,
      type: 'TEAM_RESERVATION_CANCELLED' as const,
      message,
      linkUrl: `/teams/${params.teamId}`,
    })),
  });
}
