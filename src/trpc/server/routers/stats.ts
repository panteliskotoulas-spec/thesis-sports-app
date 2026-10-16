import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../init';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import { buildPlayerStats } from '@/lib/stats/aggregate';
import type { PlayerStatsData } from '@/lib/stats/player-stats';
import {
  isTournamentSport,
  type TournamentSport,
} from '@/lib/tournaments/tournament';

type Db = PrismaClient | Prisma.TransactionClient;

const EMPTY: PlayerStatsData = { matches: [], tournaments: [] };

async function loadStatsData(
  db: Db,
  userId: string,
  sport: TournamentSport | null,
): Promise<PlayerStatsData> {
  const own = await db.matchPlayerStat.findMany({
    where: {
      userId,
      match: {
        status: 'COMPLETED',
        ...(sport && { tournament: { sportType: sport } }),
      },
    },
    select: {
      teamId: true,
      stats: true,
      match: {
        select: {
          id: true,
          round: true,
          scheduledAt: true,
          homeTeamId: true,
          awayTeamId: true,
          homeScore: true,
          awayScore: true,
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
          tournament: { select: { id: true, name: true, sportType: true } },
        },
      },
    },
  });

  if (own.length === 0) return EMPTY;

  const tournamentIds = Array.from(
    new Set(own.map((row) => row.match.tournament.id)),
  );
  const everyone = await db.matchPlayerStat.findMany({
    where: {
      match: { tournamentId: { in: tournamentIds }, status: 'COMPLETED' },
    },
    select: { stats: true, match: { select: { tournamentId: true } } },
  });

  return buildPlayerStats(
    own,
    everyone.map((row) => ({
      tournamentId: row.match.tournamentId,
      stats: row.stats,
    })),
  );
}

export const statsRouter = router({
  mine: protectedProcedure.query(
    ({ ctx }): Promise<PlayerStatsData> =>
      loadStatsData(ctx.prisma, ctx.session.user.id, null),
  ),

  forApplicant: protectedProcedure
    .input(z.object({ requestId: z.string().min(1) }))
    .query(async ({ ctx, input }): Promise<PlayerStatsData> => {
      const request = await ctx.prisma.joinRequest.findUnique({
        where: { id: input.requestId },
        select: {
          status: true,
          userId: true,
          teamId: true,
          team: { select: { sportType: true } },
        },
      });
      if (!request || request.status !== 'PENDING') {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const membership = await ctx.prisma.teamMembership.findUnique({
        where: {
          teamId_userId: {
            teamId: request.teamId,
            userId: ctx.session.user.id,
          },
        },
        select: { role: true },
      });
      if (membership?.role !== 'LEADER') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const sport = request.team.sportType;
      if (!isTournamentSport(sport)) return EMPTY;

      return loadStatsData(ctx.prisma, request.userId, sport);
    }),
});
