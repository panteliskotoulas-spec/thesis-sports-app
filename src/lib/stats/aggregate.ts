import { parseStats } from '@/lib/tournaments/aggregate';
import {
  isTournamentSport,
  type StatTotals,
} from '@/lib/tournaments/tournament';
import type {
  PlayerStatsData,
  PlayerStatsMatch,
  PlayerStatsTournament,
} from './player-stats';

export interface RawOwnStatRow {
  teamId: string;
  stats: unknown;
  match: {
    id: string;
    round: number;
    scheduledAt: Date | null;
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number | null;
    awayScore: number | null;
    homeTeam: { name: string };
    awayTeam: { name: string };
    tournament: { id: string; name: string; sportType: string };
  };
}

export interface RawTournamentStatRow {
  tournamentId: string;
  stats: unknown;
}

export function buildPlayerStats(
  ownRows: RawOwnStatRow[],
  tournamentRows: RawTournamentStatRow[],
): PlayerStatsData {
  const matches: PlayerStatsMatch[] = [];
  const tournaments = new Map<string, PlayerStatsTournament>();

  for (const row of ownRows) {
    const { match } = row;
    const sport = match.tournament.sportType;
    if (!isTournamentSport(sport)) continue;

    const isHome = row.teamId === match.homeTeamId;
    const isAway = row.teamId === match.awayTeamId;
    if (!isHome && !isAway) continue;

    matches.push({
      matchId: match.id,
      tournamentId: match.tournament.id,
      sport,
      round: match.round,
      scheduledAt: match.scheduledAt ? match.scheduledAt.toISOString() : null,
      opponentName: isHome ? match.awayTeam.name : match.homeTeam.name,
      ownScore: isHome ? match.homeScore : match.awayScore,
      opponentScore: isHome ? match.awayScore : match.homeScore,
      stats: parseStats(row.stats),
    });

    if (!tournaments.has(match.tournament.id)) {
      tournaments.set(match.tournament.id, {
        id: match.tournament.id,
        name: match.tournament.name,
        sport,
        games: 0,
        totals: {},
      });
    }
  }

  for (const row of tournamentRows) {
    const tournament = tournaments.get(row.tournamentId);
    if (!tournament) continue;
    tournament.games += 1;
    const totals: StatTotals = tournament.totals;
    for (const [key, value] of Object.entries(parseStats(row.stats))) {
      totals[key] = (totals[key] ?? 0) + value;
    }
  }

  return { matches, tournaments: Array.from(tournaments.values()) };
}
