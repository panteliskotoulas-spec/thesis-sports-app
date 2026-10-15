import { fillTemplate } from '@/lib/bookings/booking';
import type {
  MatchCompareRow,
  MatchRow,
} from '@/components/tournaments/MatchesSection';
import type {
  PlayerMetricOption,
  PlayerStatRow,
} from '@/components/tournaments/PlayerStatsSection';
import {
  COMPARE_METRICS,
  SPORT_METRICS,
  evaluateMetric,
  findMetric,
  type TournamentDetail,
} from './tournament';
import {
  formatCount,
  formatMatchDate,
  formatPercent,
  initialsOf,
} from './tournament-format';
import type {
  MatchesLabels,
  MetricLabel,
  PlayersLabels,
} from './tournament-labels';

export function buildMatchRows(
  detail: TournamentDetail,
  labels: MatchesLabels,
  metricLabels: Record<string, MetricLabel>,
  lng: string,
): MatchRow[] {
  const names = new Map(detail.teams.map((team) => [team.id, team.name]));
  const sorted = [...detail.matches].sort(
    (a, b) =>
      a.round - b.round ||
      (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''),
  );

  return sorted.map((match) => {
    const completed =
      match.status === 'COMPLETED' &&
      match.homeScore !== null &&
      match.awayScore !== null;

    let detailLabel: string;
    if (completed && match.sets && match.sets.length > 0) {
      detailLabel = match.sets
        .map(([home, away]) => `${home}-${away}`)
        .join(', ');
    } else if (match.scheduledAt) {
      detailLabel = formatMatchDate(match.scheduledAt, lng);
    } else {
      detailLabel = completed ? labels.completed : labels.tbd;
    }

    let compare: MatchCompareRow[] | null = null;
    if (completed && match.homeStats && match.awayStats) {
      const rows: MatchCompareRow[] = [];
      for (const id of COMPARE_METRICS[detail.sport]) {
        const metric = findMetric(detail.sport, id);
        if (!metric) continue;
        const home = evaluateMetric(metric, match.homeStats).value;
        const away = evaluateMetric(metric, match.awayStats).value;
        const total = home + away;
        rows.push({
          id,
          label: metricLabels[id]?.name ?? id,
          home: formatCount(home, lng),
          away: formatCount(away, lng),
          homeShare: total > 0 ? Math.round((home / total) * 100) : 50,
          homeLeads: home > away,
          awayLeads: away > home,
        });
      }
      compare = rows.length > 0 ? rows : null;
    }

    return {
      id: match.id,
      round: match.round,
      homeName: names.get(match.homeTeamId) ?? '',
      awayName: names.get(match.awayTeamId) ?? '',
      completed,
      scoreLabel: completed ? `${match.homeScore} - ${match.awayScore}` : null,
      detailLabel,
      compare,
    };
  });
}

export function buildMetricOptions(
  detail: TournamentDetail,
  metricLabels: Record<string, MetricLabel>,
): PlayerMetricOption[] {
  return SPORT_METRICS[detail.sport].map((metric) => ({
    id: metric.id,
    name: metricLabels[metric.id]?.name ?? metric.id,
    short: metricLabels[metric.id]?.short ?? metric.id,
    chip: metric.chip,
    percent: metric.ratio !== null,
  }));
}

export function buildPlayerRows(
  detail: TournamentDetail,
  labels: PlayersLabels,
  lng: string,
): PlayerStatRow[] {
  const teams = new Map(detail.teams.map((team) => [team.id, team.name]));
  const metrics = SPORT_METRICS[detail.sport];

  return detail.players.map((player) => {
    const cells: PlayerStatRow['cells'] = {};
    for (const metric of metrics) {
      const result = evaluateMetric(metric, player.stats);
      if (metric.ratio) {
        const hasData = result.den !== null && result.den > 0;
        cells[metric.id] = {
          value: result.value,
          display: hasData ? formatPercent(result.value, lng) : '—',
          detail: hasData
            ? `${formatCount(result.num ?? 0, lng)}/${formatCount(result.den ?? 0, lng)}`
            : null,
          qualified: result.qualified,
        };
      } else {
        cells[metric.id] = {
          value: result.value,
          display: formatCount(result.value, lng),
          detail:
            player.games > 0
              ? fillTemplate(labels.perGame, {
                  value: formatCount(result.value / player.games, lng),
                })
              : null,
          qualified: true,
        };
      }
    }

    return {
      userId: player.userId,
      name: player.name,
      initials: initialsOf(player.name),
      teamName: teams.get(player.teamId) ?? '',
      games: player.games,
      cells,
    };
  });
}
