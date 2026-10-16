import { protectedProcedure, router } from '../init';
import { asLocalized } from '@/lib/server/booking-shared';
import type { PendingSplitRow } from '@/lib/home/dashboard';

export const dashboardRouter = router({
  pendingSplits: protectedProcedure.query(
    async ({ ctx }): Promise<PendingSplitRow[]> => {
      const userId = ctx.session.user.id;
      const now = new Date();

      const [reservationSplits, sessionSplits] = await Promise.all([
        ctx.prisma.paymentSplit.findMany({
          where: { userId, status: 'PENDING' },
          select: { reservationId: true, amount: true },
        }),
        ctx.prisma.sessionSplit.findMany({
          where: { userId, status: 'PENDING' },
          select: { coachingSessionId: true, amount: true },
        }),
      ]);

      const [reservations, sessions] = await Promise.all([
        reservationSplits.length === 0
          ? []
          : ctx.prisma.reservation.findMany({
              where: {
                id: {
                  in: reservationSplits.map((split) => split.reservationId),
                },
                status: 'CONFIRMED',
                teamId: { not: null },
                slot: { endTime: { gt: now } },
              },
              select: {
                id: true,
                teamId: true,
                team: { select: { name: true } },
                slot: {
                  select: {
                    startTime: true,
                    endTime: true,
                    field: { select: { name: true } },
                  },
                },
              },
            }),
        sessionSplits.length === 0
          ? []
          : ctx.prisma.coachingSession.findMany({
              where: {
                id: {
                  in: sessionSplits.map((split) => split.coachingSessionId),
                },
                status: 'CONFIRMED',
                teamId: { not: null },
                slot: { endTime: { gt: now } },
              },
              select: {
                id: true,
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
            }),
      ]);

      const reservationAmounts = new Map(
        reservationSplits.map(
          (split) => [split.reservationId, split.amount.toNumber()] as const,
        ),
      );
      const sessionAmounts = new Map(
        sessionSplits.map(
          (split) =>
            [split.coachingSessionId, split.amount.toNumber()] as const,
        ),
      );

      const rows: PendingSplitRow[] = [];

      for (const reservation of reservations) {
        if (!reservation.teamId || !reservation.team) continue;
        rows.push({
          kind: 'RESERVATION',
          id: reservation.id,
          teamId: reservation.teamId,
          teamName: reservation.team.name,
          title: asLocalized(reservation.slot.field.name),
          startTime: reservation.slot.startTime,
          endTime: reservation.slot.endTime,
          amount: reservationAmounts.get(reservation.id) ?? 0,
        });
      }

      for (const session of sessions) {
        if (!session.teamId || !session.team) continue;
        const coachName = session.slot.coach.user.name;
        rows.push({
          kind: 'SESSION',
          id: session.id,
          teamId: session.teamId,
          teamName: session.team.name,
          title: { el: coachName, en: coachName },
          startTime: session.slot.startTime,
          endTime: session.slot.endTime,
          amount: sessionAmounts.get(session.id) ?? 0,
        });
      }

      return rows.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    },
  ),
});
