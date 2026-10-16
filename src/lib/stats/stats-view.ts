import { fillTemplate } from '@/lib/bookings/booking';
import {
  SPORT_METRICS,
  evaluateMetric,
  findMetric,
  type StatTotals,
  type TournamentSport,
} from '@/lib/tournaments/tournament';
import {
  formatCount,
  formatPercent,
} from '@/lib/tournaments/tournament-format';
import {
  CHART_METRIC,
  COMPARE_PLAYER_METRICS,
  RATIO_METRICS,
  TABLE_METRICS,
  TILE_METRICS,
  filterMatches,
  sumStats,
  type PlayerStatsData,
  type PlayerStatsMatch,
} from './player-stats';
import type { StatsLabels } from './stats-labels';

const TIME_ZONE = 'Europe/Athens';

export interface StatsTile {
  id: string;
  label: string;
  value: string;
}

export interface StatsRatio {
  id: string;
  label: string;
  display: string;
  detail: string | null;
  width: number;
  lowSample: boolean;
}

export interface StatsBar {
  key: string;
  label: string;
  value: number;
  display: string;
}

export interface StatsChart {
  title: string;
  aria: string;
  bars: StatsBar[];
  max: number;
}

export interface StatsCompareRow {
  id: string;
  label: string;
  values: string;
  mineWidth: number;
  averageWidth: number;
}

export interface StatsTableColumn {
  id: string;
  short: string;
  name: string;
}

export interface StatsTableRow {
  key: string;
  round: string;
  date: string | null;
  opponent: string;
  score: string;
  cells: string[];
}

export interface StatsView {
  games: number;
  tiles: StatsTile[];
  ratios: StatsRatio[];
  showSampleNote: boolean;
  chart: StatsChart | null;
  compare: StatsCompareRow[];
  columns: StatsTableColumn[];
  rows: StatsTableRow[];
}

function formatShortDate(iso: string, lng: string): string {
  return new Intl.DateTimeFormat(lng, {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function metricName(labels: StatsLabels, id: string): string {
  return labels.metrics[id]?.name ?? id;
}

function buildTiles(
  sport: TournamentSport,
  totals: StatTotals,
  games: number,
  labels: StatsLabels,
  lng: string,
): StatsTile[] {
  const tiles: StatsTile[] = [
    { id: 'games', label: labels.games, value: formatCount(games, lng) },
  ];
  for (const id of TILE_METRICS[sport]) {
    const metric = findMetric(sport, id);
    if (!metric) continue;
    tiles.push({
      id,
      label: metricName(labels, id),
      value: formatCount(evaluateMetric(metric, totals).value, lng),
    });
  }
  return tiles;
}

function buildRatios(
  sport: TournamentSport,
  totals: StatTotals,
  labels: StatsLabels,
  lng: string,
): StatsRatio[] {
  const ratios: StatsRatio[] = [];
  for (const id of RATIO_METRICS[sport]) {
    const metric = findMetric(sport, id);
    if (!metric || !metric.ratio) continue;
    const result = evaluateMetric(metric, totals);
    const den = result.den ?? 0;
    const hasData = den > 0;
    ratios.push({
      id,
      label: metricName(labels, id),
      display: hasData ? formatPercent(result.value, lng) : '—',
      detail: hasData
        ? `${formatCount(result.num ?? 0, lng)}/${formatCount(den, lng)}`
        : null,
      width: hasData ? clampPercent(result.value) : 0,
      lowSample: hasData && !result.qualified,
    });
  }
  return ratios;
}

function buildChart(
  sport: TournamentSport,
  chronological: PlayerStatsMatch[],
  labels: StatsLabels,
  lng: string,
): StatsChart | null {
  const metric = findMetric(sport, CHART_METRIC[sport]);
  if (!metric || chronological.length === 0) return null;

  const name = metricName(labels, CHART_METRIC[sport]);
  const bars = chronological.map((match, index) => {
    const value = evaluateMetric(metric, match.stats).value;
    return {
      key: match.matchId,
      label: String(index + 1),
      value,
      display: formatCount(value, lng),
    };
  });

  return {
    title: fillTemplate(labels.chart.title, { metric: name }),
    aria: fillTemplate(labels.chart.aria, { metric: name }),
    bars,
    max: Math.max(1, ...bars.map((bar) => bar.value)),
  };
}

function buildCompare(
  sport: TournamentSport,
  data: PlayerStatsData,
  tournamentId: string | null,
  ownTotals: StatTotals,
  ownGames: number,
  labels: StatsLabels,
  lng: string,
): StatsCompareRow[] {
  const playedIds = new Set(
    filterMatches(data, sport, tournamentId).map((match) => match.tournamentId),
  );
  const scope = data.tournaments.filter(
    (tournament) => tournament.sport === sport && playedIds.has(tournament.id),
  );
  const totals: StatTotals = {};
  let games = 0;
  for (const tournament of scope) {
    games += tournament.games;
    for (const [key, value] of Object.entries(tournament.totals)) {
      totals[key] = (totals[key] ?? 0) + value;
    }
  }
  if (games <= 0 || ownGames <= 0) return [];

  const rows: StatsCompareRow[] = [];
  for (const id of COMPARE_PLAYER_METRICS[sport]) {
    const metric = findMetric(sport, id);
    if (!metric) continue;
    const mine = evaluateMetric(metric, ownTotals).value / ownGames;
    const average = evaluateMetric(metric, totals).value / games;
    const top = Math.max(mine, average);
    rows.push({
      id,
      label: metricName(labels, id),
      values: fillTemplate(labels.compare.values, {
        mine: formatCount(mine, lng),
        avg: formatCount(average, lng),
      }),
      mineWidth: top > 0 ? Math.round((mine / top) * 100) : 0,
      averageWidth: top > 0 ? Math.round((average / top) * 100) : 0,
    });
  }
  return rows;
}

function buildRows(
  sport: TournamentSport,
  chronological: PlayerStatsMatch[],
  columns: StatsTableColumn[],
  labels: StatsLabels,
  lng: string,
): StatsTableRow[] {
  return [...chronological].reverse().map((match) => {
    const hasScore = match.ownScore !== null && match.opponentScore !== null;
    return {
      key: match.matchId,
      round: fillTemplate(labels.table.roundValue, { n: String(match.round) }),
      date: match.scheduledAt ? formatShortDate(match.scheduledAt, lng) : null,
      opponent: match.opponentName,
      score: hasScore ? `${match.ownScore} - ${match.opponentScore}` : '—',
      cells: columns.map((column) => {
        const metric = findMetric(sport, column.id);
        return metric
          ? formatCount(evaluateMetric(metric, match.stats).value, lng)
          : '—';
      }),
    };
  });
}

export function buildStatsView(
  data: PlayerStatsData,
  sport: TournamentSport,
  tournamentId: string | null,
  labels: StatsLabels,
  lng: string,
): StatsView {
  const chronological = filterMatches(data, sport, tournamentId);
  const games = chronological.length;
  const totals = sumStats(chronological);
  const ratios = buildRatios(sport, totals, labels, lng);

  const columns: StatsTableColumn[] = TABLE_METRICS[sport]
    .filter((id) => SPORT_METRICS[sport].some((metric) => metric.id === id))
    .map((id) => ({
      id,
      short: labels.metrics[id]?.short ?? id,
      name: metricName(labels, id),
    }));

  return {
    games,
    tiles: buildTiles(sport, totals, games, labels, lng),
    ratios,
    showSampleNote: ratios.some((ratio) => ratio.lowSample),
    chart: buildChart(sport, chronological, labels, lng),
    compare: buildCompare(
      sport,
      data,
      tournamentId,
      totals,
      games,
      labels,
      lng,
    ),
    columns,
    rows: buildRows(sport, chronological, columns, labels, lng),
  };
}
