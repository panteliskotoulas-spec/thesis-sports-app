import { STAT_KEYS, type StatTotals, type TournamentSport } from './tournament';

export const STAT_VALUE_MAX = 300;
export const SCORE_MAX = 300;
export const SET_POINTS_MAX = 99;
export const SETS_TO_WIN = 3;

export interface PlayerStatInput {
  userId: string;
  teamId: string;
  stats: Record<string, number>;
}

export interface ResultInput {
  homeScore: number | null;
  awayScore: number | null;
  sets: [number, number][] | null;
  players: PlayerStatInput[];
}

export type ResultErrorCode =
  | 'SCORE_INVALID'
  | 'TIE_NOT_ALLOWED'
  | 'SETS_INVALID'
  | 'STAT_KEY_INVALID'
  | 'STAT_VALUE_INVALID'
  | 'STAT_INCONSISTENT'
  | 'PLAYER_DUPLICATE'
  | 'PLAYER_TEAM_INVALID'
  | 'POINTS_MISMATCH'
  | 'GOALS_EXCEED_SCORE';

export interface CheckedResult {
  homeScore: number;
  awayScore: number;
  sets: [number, number][] | null;
  players: PlayerStatInput[];
}

export type ResultCheck =
  | { ok: true; result: CheckedResult }
  | { ok: false; code: ResultErrorCode };

function fail(code: ResultErrorCode): ResultCheck {
  return { ok: false, code };
}

function isCount(value: unknown, max: number): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= max
  );
}

function stat(stats: StatTotals, key: string): number {
  return stats[key] ?? 0;
}

export function basketballPoints(stats: StatTotals): number {
  return (
    2 * stat(stats, 'twoMade') +
    3 * stat(stats, 'threeMade') +
    stat(stats, 'ftMade')
  );
}

function normalizeStats(
  sport: TournamentSport,
  raw: Record<string, number>,
): StatTotals | ResultErrorCode {
  const allowed = new Set(STAT_KEYS[sport]);
  const normalized: StatTotals = {};
  for (const key of STAT_KEYS[sport]) normalized[key] = 0;

  for (const [key, value] of Object.entries(raw)) {
    if (!allowed.has(key)) return 'STAT_KEY_INVALID';
    if (!isCount(value, STAT_VALUE_MAX)) return 'STAT_VALUE_INVALID';
    normalized[key] = value;
  }

  return normalized;
}

function isInconsistent(sport: TournamentSport, stats: StatTotals): boolean {
  if (sport === 'FOOTBALL') {
    return stat(stats, 'shotsOnTarget') > stat(stats, 'shots');
  }
  if (sport === 'BASKETBALL') {
    return (
      stat(stats, 'twoMade') > stat(stats, 'twoAtt') ||
      stat(stats, 'threeMade') > stat(stats, 'threeAtt') ||
      stat(stats, 'ftMade') > stat(stats, 'ftAtt')
    );
  }
  return (
    stat(stats, 'kills') + stat(stats, 'attackErrors') >
    stat(stats, 'attackAttempts')
  );
}

function checkSets(
  sets: [number, number][] | null,
): { homeScore: number; awayScore: number; sets: [number, number][] } | null {
  if (!sets || sets.length < SETS_TO_WIN || sets.length > 2 * SETS_TO_WIN - 1) {
    return null;
  }

  let home = 0;
  let away = 0;
  for (const [homePoints, awayPoints] of sets) {
    if (home === SETS_TO_WIN || away === SETS_TO_WIN) return null;
    if (
      !isCount(homePoints, SET_POINTS_MAX) ||
      !isCount(awayPoints, SET_POINTS_MAX) ||
      homePoints === awayPoints
    ) {
      return null;
    }
    if (homePoints > awayPoints) home += 1;
    else away += 1;
  }

  if (home !== SETS_TO_WIN && away !== SETS_TO_WIN) return null;
  return { homeScore: home, awayScore: away, sets };
}

export function checkResult(
  sport: TournamentSport,
  homeTeamId: string,
  awayTeamId: string,
  input: ResultInput,
): ResultCheck {
  let homeScore: number;
  let awayScore: number;
  let sets: [number, number][] | null = null;

  if (sport === 'VOLLEYBALL') {
    const checked = checkSets(input.sets);
    if (!checked) return fail('SETS_INVALID');
    homeScore = checked.homeScore;
    awayScore = checked.awayScore;
    sets = checked.sets;
  } else {
    if (
      input.sets !== null ||
      !isCount(input.homeScore, SCORE_MAX) ||
      !isCount(input.awayScore, SCORE_MAX)
    ) {
      return fail('SCORE_INVALID');
    }
    homeScore = input.homeScore;
    awayScore = input.awayScore;
    if (sport === 'BASKETBALL' && homeScore === awayScore) {
      return fail('TIE_NOT_ALLOWED');
    }
  }

  const seen = new Set<string>();
  const players: PlayerStatInput[] = [];
  const totals = new Map<
    string,
    { goals: number; points: number; count: number }
  >();

  for (const player of input.players) {
    if (player.teamId !== homeTeamId && player.teamId !== awayTeamId) {
      return fail('PLAYER_TEAM_INVALID');
    }
    if (seen.has(player.userId)) return fail('PLAYER_DUPLICATE');
    seen.add(player.userId);

    const normalized = normalizeStats(sport, player.stats);
    if (typeof normalized === 'string') return fail(normalized);
    if (isInconsistent(sport, normalized)) return fail('STAT_INCONSISTENT');

    const current = totals.get(player.teamId) ?? {
      goals: 0,
      points: 0,
      count: 0,
    };
    current.goals += stat(normalized, 'goals');
    current.points += basketballPoints(normalized);
    current.count += 1;
    totals.set(player.teamId, current);

    players.push({
      userId: player.userId,
      teamId: player.teamId,
      stats: normalized,
    });
  }

  const scores: [string, number][] = [
    [homeTeamId, homeScore],
    [awayTeamId, awayScore],
  ];
  for (const [teamId, score] of scores) {
    const total = totals.get(teamId);
    if (!total) continue;
    if (sport === 'FOOTBALL' && total.goals > score) {
      return fail('GOALS_EXCEED_SCORE');
    }
    if (sport === 'BASKETBALL' && total.points !== score) {
      return fail('POINTS_MISMATCH');
    }
  }

  return { ok: true, result: { homeScore, awayScore, sets, players } };
}
