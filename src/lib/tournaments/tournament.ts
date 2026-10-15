export const TOURNAMENT_SPORTS = [
  'FOOTBALL',
  'BASKETBALL',
  'VOLLEYBALL',
] as const;
export type TournamentSport = (typeof TOURNAMENT_SPORTS)[number];

export const TOURNAMENT_STATUSES = [
  'UPCOMING',
  'ONGOING',
  'COMPLETED',
] as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

export type TournamentMatchStatus = 'SCHEDULED' | 'COMPLETED';

export type StatTotals = Record<string, number>;

export interface TournamentTeamItem {
  id: string;
  name: string;
}

export interface TournamentMatch {
  id: string;
  round: number;
  homeTeamId: string;
  awayTeamId: string;
  status: TournamentMatchStatus;
  scheduledAt: string | null;
  homeScore: number | null;
  awayScore: number | null;
  sets: [number, number][] | null;
  homeStats: StatTotals | null;
  awayStats: StatTotals | null;
}

export interface TournamentPlayerTotals {
  userId: string;
  name: string;
  teamId: string;
  games: number;
  stats: StatTotals;
}

export interface TournamentListItem {
  id: string;
  name: string;
  sport: TournamentSport;
  status: TournamentStatus;
  startDate: string;
  endDate: string;
  fieldName: string;
  teamCount: number;
  maxTeams: number;
}

export interface TournamentDetail extends TournamentListItem {
  description: string;
  teams: TournamentTeamItem[];
  matches: TournamentMatch[];
  players: TournamentPlayerTotals[];
}

export const MIN_SAMPLE = 5;

export const STAT_KEYS: Record<TournamentSport, readonly string[]> = {
  FOOTBALL: [
    'goals',
    'assists',
    'shots',
    'shotsOnTarget',
    'fouls',
    'saves',
    'yellowCards',
    'redCards',
  ],
  BASKETBALL: [
    'twoMade',
    'twoAtt',
    'threeMade',
    'threeAtt',
    'ftMade',
    'ftAtt',
    'rebounds',
    'assists',
    'steals',
    'blocks',
    'turnovers',
    'fouls',
  ],
  VOLLEYBALL: [
    'kills',
    'attackAttempts',
    'attackErrors',
    'aces',
    'serveErrors',
    'blocks',
    'digs',
    'assists',
  ],
};

export interface MetricDef {
  id: string;
  chip: boolean;
  count: ((stats: StatTotals) => number) | null;
  ratio: ((stats: StatTotals) => { num: number; den: number }) | null;
}

function stat(stats: StatTotals, key: string): number {
  return stats[key] ?? 0;
}

function raw(id: string, chip: boolean): MetricDef {
  return { id, chip, count: (stats) => stat(stats, id), ratio: null };
}

function derived(
  id: string,
  chip: boolean,
  count: (stats: StatTotals) => number,
): MetricDef {
  return { id, chip, count, ratio: null };
}

function percent(
  id: string,
  chip: boolean,
  ratio: (stats: StatTotals) => { num: number; den: number },
): MetricDef {
  return { id, chip, count: null, ratio };
}

export const SPORT_METRICS: Record<TournamentSport, MetricDef[]> = {
  FOOTBALL: [
    raw('goals', true),
    raw('assists', true),
    raw('shots', true),
    raw('shotsOnTarget', false),
    percent('shotAccuracy', true, (s) => ({
      num: stat(s, 'shotsOnTarget'),
      den: stat(s, 'shots'),
    })),
    percent('conversion', true, (s) => ({
      num: stat(s, 'goals'),
      den: stat(s, 'shots'),
    })),
    raw('saves', true),
    raw('yellowCards', true),
    raw('redCards', true),
    raw('fouls', false),
  ],
  BASKETBALL: [
    derived(
      'points',
      true,
      (s) =>
        2 * stat(s, 'twoMade') + 3 * stat(s, 'threeMade') + stat(s, 'ftMade'),
    ),
    percent('twoPct', true, (s) => ({
      num: stat(s, 'twoMade'),
      den: stat(s, 'twoAtt'),
    })),
    percent('threePct', true, (s) => ({
      num: stat(s, 'threeMade'),
      den: stat(s, 'threeAtt'),
    })),
    percent('ftPct', true, (s) => ({
      num: stat(s, 'ftMade'),
      den: stat(s, 'ftAtt'),
    })),
    percent('fgPct', false, (s) => ({
      num: stat(s, 'twoMade') + stat(s, 'threeMade'),
      den: stat(s, 'twoAtt') + stat(s, 'threeAtt'),
    })),
    raw('rebounds', true),
    raw('assists', true),
    raw('steals', true),
    raw('blocks', true),
    raw('turnovers', false),
    raw('fouls', false),
  ],
  VOLLEYBALL: [
    raw('kills', true),
    percent('killPct', true, (s) => ({
      num: stat(s, 'kills'),
      den: stat(s, 'attackAttempts'),
    })),
    percent('hittingPct', true, (s) => ({
      num: stat(s, 'kills') - stat(s, 'attackErrors'),
      den: stat(s, 'attackAttempts'),
    })),
    raw('attackAttempts', false),
    raw('attackErrors', false),
    raw('aces', true),
    raw('serveErrors', true),
    raw('blocks', true),
    raw('digs', true),
    raw('assists', true),
  ],
};

export const COMPARE_METRICS: Record<TournamentSport, string[]> = {
  FOOTBALL: ['shots', 'shotsOnTarget', 'fouls', 'yellowCards'],
  BASKETBALL: ['points', 'rebounds', 'assists', 'turnovers'],
  VOLLEYBALL: ['kills', 'aces', 'blocks', 'serveErrors'],
};

export const ALL_METRIC_IDS: string[] = Array.from(
  new Set(
    TOURNAMENT_SPORTS.flatMap((sport) =>
      SPORT_METRICS[sport].map((metric) => metric.id),
    ),
  ),
);

export function findMetric(
  sport: TournamentSport,
  id: string,
): MetricDef | null {
  return SPORT_METRICS[sport].find((metric) => metric.id === id) ?? null;
}

export interface MetricValue {
  value: number;
  num: number | null;
  den: number | null;
  qualified: boolean;
}

export function evaluateMetric(
  metric: MetricDef,
  stats: StatTotals,
): MetricValue {
  if (metric.ratio) {
    const { num, den } = metric.ratio(stats);
    return {
      value: den > 0 ? (num / den) * 100 : 0,
      num,
      den,
      qualified: den >= MIN_SAMPLE,
    };
  }
  return {
    value: metric.count ? metric.count(stats) : 0,
    num: null,
    den: null,
    qualified: true,
  };
}

export function isTournamentSport(value: unknown): value is TournamentSport {
  return TOURNAMENT_SPORTS.some((sport) => sport === value);
}

export function isTournamentStatus(value: unknown): value is TournamentStatus {
  return TOURNAMENT_STATUSES.some((status) => status === value);
}
