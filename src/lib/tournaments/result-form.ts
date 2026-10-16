import {
  checkResult,
  type CheckedResult,
  type ResultErrorCode,
  type ResultInput,
} from './result';
import { STAT_KEYS, type TournamentSport } from './tournament';

export const MIN_SETS = 3;
export const MAX_SETS = 5;
export const SCORE_DIGITS = 3;
export const SET_DIGITS = 2;
export const STAT_DIGITS = 3;

export interface StatColumn {
  id: string;
  keys: readonly string[];
  computed: boolean;
}

export interface SportColumns {
  main: StatColumn[];
  extra: StatColumn[];
}

function single(id: string): StatColumn {
  return { id, keys: [id], computed: false };
}

function pair(id: string, made: string, attempts: string): StatColumn {
  return { id, keys: [made, attempts], computed: false };
}

const POINTS_COLUMN: StatColumn = { id: 'points', keys: [], computed: true };

export const SPORT_COLUMNS: Record<TournamentSport, SportColumns> = {
  FOOTBALL: {
    main: [
      single('goals'),
      single('assists'),
      single('shots'),
      single('shotsOnTarget'),
    ],
    extra: [
      single('saves'),
      single('fouls'),
      single('yellowCards'),
      single('redCards'),
    ],
  },
  BASKETBALL: {
    main: [
      pair('two', 'twoMade', 'twoAtt'),
      pair('three', 'threeMade', 'threeAtt'),
      pair('ft', 'ftMade', 'ftAtt'),
      single('rebounds'),
      POINTS_COLUMN,
    ],
    extra: [
      single('assists'),
      single('steals'),
      single('blocks'),
      single('turnovers'),
      single('fouls'),
    ],
  },
  VOLLEYBALL: {
    main: [
      single('kills'),
      single('attackAttempts'),
      single('attackErrors'),
      single('aces'),
    ],
    extra: [
      single('serveErrors'),
      single('blocks'),
      single('digs'),
      single('assists'),
    ],
  },
};

const ADMIN_COLUMN_IDS = ['two', 'three', 'ft'];

export function columnLabelKey(id: string): string {
  return ADMIN_COLUMN_IDS.includes(id)
    ? `admin.result.columns.${id}`
    : `metrics.${id}`;
}

export interface ResultPlayerRow {
  userId: string;
  teamId: string;
  name: string;
  former: boolean;
}

export interface SetFormState {
  home: string;
  away: string;
}

export interface PlayerFormState {
  included: boolean;
  stats: Record<string, string>;
}

export interface ResultFormState {
  homeScore: string;
  awayScore: string;
  sets: SetFormState[];
  players: Record<string, PlayerFormState>;
}

export interface RosterMemberInput {
  teamId: string;
  userId: string;
  name: string;
}

export interface RosterStatInput {
  teamId: string;
  userId: string;
  stats: unknown;
}

export function buildPlayerRows(
  teamId: string,
  members: RosterMemberInput[],
  playerStats: RosterStatInput[],
): ResultPlayerRow[] {
  const rows: ResultPlayerRow[] = [];
  const seen = new Set<string>();

  for (const member of members) {
    if (member.teamId !== teamId || seen.has(member.userId)) continue;
    seen.add(member.userId);
    rows.push({
      userId: member.userId,
      teamId,
      name: member.name,
      former: false,
    });
  }

  for (const stat of playerStats) {
    if (stat.teamId !== teamId || seen.has(stat.userId)) continue;
    seen.add(stat.userId);
    rows.push({ userId: stat.userId, teamId, name: '', former: true });
  }

  return rows;
}

export function parseStoredSets(value: unknown): [number, number][] | null {
  if (!Array.isArray(value)) return null;
  const sets: [number, number][] = [];
  for (const entry of value) {
    if (
      Array.isArray(entry) &&
      entry.length === 2 &&
      typeof entry[0] === 'number' &&
      typeof entry[1] === 'number'
    ) {
      sets.push([entry[0], entry[1]]);
    }
  }
  return sets.length > 0 ? sets : null;
}

export function parseStoredStats(value: unknown): Record<string, number> {
  const stats: Record<string, number> = {};
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return stats;
  }
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'number' && Number.isFinite(entry)) {
      stats[key] = entry;
    }
  }
  return stats;
}

export interface ExistingResult {
  homeScore: number | null;
  awayScore: number | null;
  sets: [number, number][] | null;
  playerStats: RosterStatInput[];
}

function emptySets(): SetFormState[] {
  return Array.from({ length: MIN_SETS }, () => ({ home: '', away: '' }));
}

export function initialFormState(
  sport: TournamentSport,
  rows: ResultPlayerRow[],
  existing: ExistingResult | null,
): ResultFormState {
  const stored = new Map<string, Record<string, number>>();
  if (existing) {
    for (const stat of existing.playerStats) {
      stored.set(stat.userId, parseStoredStats(stat.stats));
    }
  }

  const players: Record<string, PlayerFormState> = {};
  for (const row of rows) {
    const values = stored.get(row.userId);
    const stats: Record<string, string> = {};
    for (const key of STAT_KEYS[sport]) {
      stats[key] = values ? String(values[key] ?? 0) : '';
    }
    players[row.userId] = { included: values !== undefined, stats };
  }

  const sets =
    existing?.sets && existing.sets.length > 0
      ? existing.sets.map(([home, away]) => ({
          home: String(home),
          away: String(away),
        }))
      : emptySets();

  return {
    homeScore:
      existing && existing.homeScore !== null ? String(existing.homeScore) : '',
    awayScore:
      existing && existing.awayScore !== null ? String(existing.awayScore) : '',
    sets: sport === 'VOLLEYBALL' ? sets : [],
    players,
  };
}

export function digitsOnly(value: string, maxLength: number): string {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

function parseCount(value: string): number {
  if (value === '') return 0;
  return /^\d+$/.test(value) ? Number(value) : -1;
}

function parseScore(value: string): number | null {
  return /^\d+$/.test(value) ? Number(value) : null;
}

function parseSetPoints(value: string): number {
  return /^\d+$/.test(value) ? Number(value) : -1;
}

export type BuildResult =
  | { ok: true; result: CheckedResult }
  | { ok: false; code: ResultErrorCode };

export function buildResultInput(
  sport: TournamentSport,
  homeTeamId: string,
  awayTeamId: string,
  rows: ResultPlayerRow[],
  state: ResultFormState,
): BuildResult {
  const players: ResultInput['players'] = [];
  for (const row of rows) {
    const entry = state.players[row.userId];
    if (!entry || !entry.included) continue;
    const stats: Record<string, number> = {};
    for (const key of STAT_KEYS[sport]) {
      stats[key] = parseCount(entry.stats[key] ?? '');
    }
    players.push({ userId: row.userId, teamId: row.teamId, stats });
  }

  const input: ResultInput =
    sport === 'VOLLEYBALL'
      ? {
          homeScore: null,
          awayScore: null,
          sets: state.sets.map((set): [number, number] => [
            parseSetPoints(set.home),
            parseSetPoints(set.away),
          ]),
          players,
        }
      : {
          homeScore: parseScore(state.homeScore),
          awayScore: parseScore(state.awayScore),
          sets: null,
          players,
        };

  return checkResult(sport, homeTeamId, awayTeamId, input);
}

function countOf(stats: Record<string, string>, key: string): number {
  return Math.max(0, parseCount(stats[key] ?? ''));
}

export function playerBasketballPoints(stats: Record<string, string>): number {
  return (
    2 * countOf(stats, 'twoMade') +
    3 * countOf(stats, 'threeMade') +
    countOf(stats, 'ftMade')
  );
}

export interface PointsSummary {
  sum: number;
  score: number | null;
  matches: boolean;
}

export function teamPointsSummary(
  rows: ResultPlayerRow[],
  state: ResultFormState,
  scoreText: string,
): PointsSummary | null {
  let sum = 0;
  let included = 0;
  for (const row of rows) {
    const entry = state.players[row.userId];
    if (!entry || !entry.included) continue;
    included += 1;
    sum += playerBasketballPoints(entry.stats);
  }
  if (included === 0) return null;
  const score = parseScore(scoreText);
  return { sum, score, matches: score !== null && score === sum };
}

export function setWins(sets: SetFormState[]): { home: number; away: number } {
  let home = 0;
  let away = 0;
  for (const set of sets) {
    const homePoints = parseScore(set.home);
    const awayPoints = parseScore(set.away);
    if (homePoints === null || awayPoints === null) continue;
    if (homePoints > awayPoints) home += 1;
    else if (awayPoints > homePoints) away += 1;
  }
  return { home, away };
}
