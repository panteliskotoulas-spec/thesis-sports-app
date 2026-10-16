import type { getT } from '@/i18n.server';
import {
  TOURNAMENT_SPORTS,
  type TournamentSport,
} from '@/lib/tournaments/tournament';
import {
  buildTournamentLabels,
  type MetricLabel,
} from '@/lib/tournaments/tournament-labels';

type Translate = Awaited<ReturnType<typeof getT>>['t'];

export interface StatsLabels {
  sportLabel: string;
  sports: Record<TournamentSport, string>;
  tournamentLabel: string;
  allTournaments: string;
  games: string;
  metrics: Record<string, MetricLabel>;
  ratios: {
    title: string;
    lowSample: string;
    note: string;
  };
  chart: {
    title: string;
    aria: string;
    match: string;
  };
  compare: {
    title: string;
    caption: string;
    mine: string;
    average: string;
    values: string;
  };
  table: {
    title: string;
    aria: string;
    round: string;
    roundValue: string;
    opponent: string;
    score: string;
  };
  empty: {
    title: string;
    description: string;
    cta: string | null;
  };
}

export function buildStatsLabels(t: Translate): StatsLabels {
  const sports = {} as Record<TournamentSport, string>;
  for (const sport of TOURNAMENT_SPORTS) {
    sports[sport] = t(`stats.sports.${sport}`);
  }

  return {
    sportLabel: t('stats.sportLabel'),
    sports,
    tournamentLabel: t('stats.tournamentLabel'),
    allTournaments: t('stats.allTournaments'),
    games: t('stats.games'),
    metrics: buildTournamentLabels(t).metrics,
    ratios: {
      title: t('stats.ratios.title'),
      lowSample: t('stats.ratios.lowSample'),
      note: t('stats.ratios.note'),
    },
    chart: {
      title: t('stats.chart.title'),
      aria: t('stats.chart.aria'),
      match: t('stats.chart.match'),
    },
    compare: {
      title: t('stats.compare.title'),
      caption: t('stats.compare.caption'),
      mine: t('stats.compare.mine'),
      average: t('stats.compare.average'),
      values: t('stats.compare.values'),
    },
    table: {
      title: t('stats.table.title'),
      aria: t('stats.table.aria'),
      round: t('stats.table.round'),
      roundValue: t('stats.table.roundValue'),
      opponent: t('stats.table.opponent'),
      score: t('stats.table.score'),
    },
    empty: {
      title: t('stats.empty.title'),
      description: t('stats.empty.description'),
      cta: t('stats.empty.cta'),
    },
  };
}
