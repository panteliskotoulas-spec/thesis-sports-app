import { adminProcedure, protectedProcedure, router } from '../init';
import { asLocalized } from '@/lib/server/booking-shared';
import type { AdminPendingRow } from '@/lib/home/admin-dashboard';
import type { PendingSplitRow } from '@/lib/home/dashboard';
import type { OwnerFieldWithoutSlotsRow } from '@/lib/home/owner-dashboard';

export const dashboardRouter = router({
  adminPending: adminProcedure.query(
    async ({ ctx }): Promise<AdminPendingRow> => {
      const [fields, coaches, grouped] = await Promise.all([
        ctx.prisma.field.count({
          where: { status: 'PENDING', archivedAt: null },
        }),
        ctx.prisma.coach.count({ where: { status: 'PENDING' } }),
        ctx.prisma.tournamentTeamRequest.groupBy({
          by: ['tournamentId'],
          where: {
            status: 'PENDING',
            tournament: { status: { not: 'COMPLETED' } },
          },
          _count: { _all: true },
        }),
      ]);

      const names =
        grouped.length === 0
          ? []
          : await ctx.prisma.tournament.findMany({
              where: { id: { in: grouped.map((entry) => entry.tournamentId) } },
              select: { id: true, name: true },
            });

      const nameById = new Map(
        names.map((tournament) => [tournament.id, tournament.name] as const),
      );

      const tournaments = grouped
        .map((entry) => ({
          id: entry.tournamentId,
          name: nameById.get(entry.tournamentId) ?? '',
          count: entry._count._all,
        }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

      return {
        fields,
        coaches,
        tournamentRequests: tournaments.reduce(
          (sum, tournament) => sum + tournament.count,
          0,
        ),
        tournaments,
      };
    },
  ),

  ownerFieldsWithoutSlots: protectedProcedure.query(
    async ({ ctx }): Promise<OwnerFieldWithoutSlotsRow[]> => {
      const fields = await ctx.prisma.field.findMany({
        where: {
          ownerId: ctx.session.user.id,
          status: 'APPROVED',
          archivedAt: null,
          slots: { none: { startTime: { gt: new Date() } } },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true },
      });

      return fields.map((field) => ({
        id: field.id,
        name: asLocalized(field.name),
      }));
    },
  ),

  coachOpenSlots: protectedProcedure.query(
    ({ ctx }): Promise<number> =>
      ctx.prisma.coachAvailabilitySlot.count({
        where: {
          coach: { userId: ctx.session.user.id },
          status: 'OPEN',
          startTime: { gt: new Date() },
        },
      }),
  ),

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
