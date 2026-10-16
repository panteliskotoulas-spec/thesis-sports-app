import { protectedProcedure, router } from '../init';
import { buildPlayerStats } from '@/lib/stats/aggregate';
import type { PlayerStatsData } from '@/lib/stats/player-stats';

export const statsRouter = router({
  mine: protectedProcedure.query(async ({ ctx }): Promise<PlayerStatsData> => {
    const own = await ctx.prisma.matchPlayerStat.findMany({
      where: { userId: ctx.session.user.id, match: { status: 'COMPLETED' } },
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

    if (own.length === 0) return { matches: [], tournaments: [] };

    const tournamentIds = Array.from(
      new Set(own.map((row) => row.match.tournament.id)),
    );
    const everyone = await ctx.prisma.matchPlayerStat.findMany({
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
  }),
});
