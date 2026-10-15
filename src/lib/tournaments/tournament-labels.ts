import type { getT } from '@/i18n.server';
import {
  ALL_METRIC_IDS,
  MIN_SAMPLE,
  TOURNAMENT_STATUSES,
  type TournamentStatus,
} from './tournament';

type Translate = Awaited<ReturnType<typeof getT>>['t'];

export const STANDING_COLUMNS = [
  'played',
  'won',
  'drawn',
  'lost',
  'diffGoals',
  'diffPoints',
  'sets',
  'points',
] as const;
export type StandingColumn = (typeof STANDING_COLUMNS)[number];

export interface ColumnLabel {
  short: string;
  full: string;
}

export interface StandingsLabels {
  title: string;
  caption: string;
  empty: string;
  team: string;
  rank: ColumnLabel;
  columns: Record<StandingColumn, ColumnLabel>;
}

export interface TrendLabels {
  title: string;
  caption: string;
  aria: string;
  round: string;
}

export interface MatchesLabels {
  title: string;
  caption: string;
  empty: string;
  round: string;
  scheduled: string;
  tbd: string;
  completed: string;
  compareShow: string;
  compareHide: string;
}

export interface MetricLabel {
  name: string;
  short: string;
}

export interface PlayersLabels {
  title: string;
  caption: string;
  empty: string;
  player: string;
  games: ColumnLabel;
  chipsLabel: string;
  fullShow: string;
  fullHide: string;
  tableAria: string;
  perGame: string;
  lowSample: string;
  sampleNote: string;
  noData: string;
}

export interface TournamentLabels {
  status: Record<TournamentStatus, string>;
  standings: StandingsLabels;
  trend: TrendLabels;
  matches: MatchesLabels;
  players: PlayersLabels;
  metrics: Record<string, MetricLabel>;
}

function column(t: Translate, key: string): ColumnLabel {
  return {
    short: t(`standings.columns.${key}.short`),
    full: t(`standings.columns.${key}.full`),
  };
}

export function buildTournamentLabels(t: Translate): TournamentLabels {
  const status = {} as Record<TournamentStatus, string>;
  for (const value of TOURNAMENT_STATUSES) {
    status[value] = t(`status.${value}`);
  }

  const columns = {} as Record<StandingColumn, ColumnLabel>;
  for (const key of STANDING_COLUMNS) {
    columns[key] = column(t, key);
  }

  const metrics: Record<string, MetricLabel> = {};
  for (const id of ALL_METRIC_IDS) {
    metrics[id] = {
      name: t(`metrics.${id}.name`),
      short: t(`metrics.${id}.short`),
    };
  }

  return {
    status,
    standings: {
      title: t('standings.title'),
      caption: t('standings.caption'),
      empty: t('standings.empty'),
      team: t('standings.team'),
      rank: {
        short: t('standings.rank.short'),
        full: t('standings.rank.full'),
      },
      columns,
    },
    trend: {
      title: t('trend.title'),
      caption: t('trend.caption'),
      aria: t('trend.aria'),
      round: t('trend.round'),
    },
    matches: {
      title: t('matches.title'),
      caption: t('matches.caption'),
      empty: t('matches.empty'),
      round: t('matches.round'),
      scheduled: t('matches.scheduled'),
      tbd: t('matches.tbd'),
      completed: t('matches.completed'),
      compareShow: t('matches.compareShow'),
      compareHide: t('matches.compareHide'),
    },
    players: {
      title: t('players.title'),
      caption: t('players.caption'),
      empty: t('players.empty'),
      player: t('players.player'),
      games: {
        short: t('players.games.short'),
        full: t('players.games.full'),
      },
      chipsLabel: t('players.chipsLabel'),
      fullShow: t('players.fullShow'),
      fullHide: t('players.fullHide'),
      tableAria: t('players.tableAria'),
      perGame: t('players.perGame'),
      lowSample: t('players.lowSample'),
      sampleNote: t('players.sampleNote', { n: MIN_SAMPLE }),
      noData: t('players.noData'),
    },
    metrics,
  };
}
