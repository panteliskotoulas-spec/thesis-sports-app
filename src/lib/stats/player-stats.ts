import {
  TOURNAMENT_SPORTS,
  type StatTotals,
  type TournamentSport,
} from '@/lib/tournaments/tournament';

export interface PlayerStatsMatch {
  matchId: string;
  tournamentId: string;
  sport: TournamentSport;
  round: number;
  scheduledAt: string | null;
  opponentName: string;
  ownScore: number | null;
  opponentScore: number | null;
  stats: StatTotals;
}

export interface PlayerStatsTournament {
  id: string;
  name: string;
  sport: TournamentSport;
  games: number;
  totals: StatTotals;
}

export interface PlayerStatsData {
  matches: PlayerStatsMatch[];
  tournaments: PlayerStatsTournament[];
}

export const EMPTY_PLAYER_STATS: PlayerStatsData = {
  matches: [],
  tournaments: [],
};

export const TILE_METRICS: Record<TournamentSport, string[]> = {
  FOOTBALL: ['goals', 'assists', 'shots'],
  BASKETBALL: ['points', 'rebounds', 'assists'],
  VOLLEYBALL: ['kills', 'aces', 'blocks'],
};

export const RATIO_METRICS: Record<TournamentSport, string[]> = {
  FOOTBALL: ['shotAccuracy', 'conversion'],
  BASKETBALL: ['twoPct', 'threePct', 'ftPct'],
  VOLLEYBALL: ['killPct', 'hittingPct'],
};

export const CHART_METRIC: Record<TournamentSport, string> = {
  FOOTBALL: 'goals',
  BASKETBALL: 'points',
  VOLLEYBALL: 'kills',
};

export const COMPARE_PLAYER_METRICS: Record<TournamentSport, string[]> = {
  FOOTBALL: ['shots', 'goals', 'fouls'],
  BASKETBALL: ['points', 'rebounds', 'assists'],
  VOLLEYBALL: ['kills', 'aces', 'blocks'],
};

export const TABLE_METRICS: Record<TournamentSport, string[]> = {
  FOOTBALL: ['goals', 'assists'],
  BASKETBALL: ['points', 'rebounds'],
  VOLLEYBALL: ['kills', 'aces'],
};

export function sportsWithData(data: PlayerStatsData): TournamentSport[] {
  const counts = new Map<TournamentSport, number>();
  for (const match of data.matches) {
    counts.set(match.sport, (counts.get(match.sport) ?? 0) + 1);
  }
  return TOURNAMENT_SPORTS.filter((sport) => (counts.get(sport) ?? 0) > 0).sort(
    (a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0),
  );
}

export function pickDefaultSport(
  data: PlayerStatsData,
): TournamentSport | null {
  return sportsWithData(data)[0] ?? null;
}

export function tournamentsForSport(
  data: PlayerStatsData,
  sport: TournamentSport,
): PlayerStatsTournament[] {
  const played = new Set(
    data.matches
      .filter((match) => match.sport === sport)
      .map((match) => match.tournamentId),
  );
  return data.tournaments.filter(
    (tournament) => tournament.sport === sport && played.has(tournament.id),
  );
}

export function filterMatches(
  data: PlayerStatsData,
  sport: TournamentSport,
  tournamentId: string | null,
): PlayerStatsMatch[] {
  return data.matches
    .filter(
      (match) =>
        match.sport === sport &&
        (tournamentId === null || match.tournamentId === tournamentId),
    )
    .sort(
      (a, b) =>
        (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? '') ||
        a.round - b.round,
    );
}

export function sumStats(matches: PlayerStatsMatch[]): StatTotals {
  const total: StatTotals = {};
  for (const match of matches) {
    for (const [key, value] of Object.entries(match.stats)) {
      total[key] = (total[key] ?? 0) + value;
    }
  }
  return total;
}
