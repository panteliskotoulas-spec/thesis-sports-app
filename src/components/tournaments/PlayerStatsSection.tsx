'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { chipOff, chipOn } from '@/components/fields/chipStyles';
import type { PlayersLabels } from '@/lib/tournaments/tournament-labels';

const LEADERBOARD_LIMIT = 10;

const chipSize =
  'inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full border-[0.5px] px-3.5 text-sm font-medium';

export interface PlayerStatCell {
  value: number;
  display: string;
  detail: string | null;
  qualified: boolean;
}

export interface PlayerStatRow {
  userId: string;
  name: string;
  initials: string;
  teamName: string;
  games: number;
  cells: Record<string, PlayerStatCell>;
}

export interface PlayerMetricOption {
  id: string;
  name: string;
  short: string;
  chip: boolean;
  percent: boolean;
}

export function PlayerStatsSection({
  metrics,
  players,
  labels,
}: {
  metrics: PlayerMetricOption[];
  players: PlayerStatRow[];
  labels: PlayersLabels;
}) {
  const chips = metrics.filter((metric) => metric.chip);
  const [metricId, setMetricId] = useState(
    chips[0]?.id ?? metrics[0]?.id ?? '',
  );
  const [showFull, setShowFull] = useState(false);

  if (players.length === 0 || metrics.length === 0) {
    return <p className="text-muted-foreground">{labels.empty}</p>;
  }

  const selected =
    metrics.find((metric) => metric.id === metricId) ?? metrics[0];
  const byValue = (a: PlayerStatRow, b: PlayerStatRow) =>
    (b.cells[selected.id]?.value ?? 0) - (a.cells[selected.id]?.value ?? 0) ||
    a.name.localeCompare(b.name);
  const ranked = players
    .filter((player) => player.cells[selected.id]?.qualified)
    .sort(byValue)
    .slice(0, LEADERBOARD_LIMIT);
  const lowSample = players
    .filter(
      (player) =>
        player.cells[selected.id] && !player.cells[selected.id].qualified,
    )
    .sort(byValue)
    .slice(0, Math.max(0, LEADERBOARD_LIMIT - ranked.length));
  const maxValue = Math.max(
    1,
    ...ranked.map((player) => player.cells[selected.id].value),
  );

  return (
    <div>
      <div
        role="group"
        aria-label={labels.chipsLabel}
        className="flex flex-wrap gap-2"
      >
        {chips.map((metric) => {
          const active = metric.id === selected.id;
          return (
            <button
              key={metric.id}
              type="button"
              aria-pressed={active}
              onClick={() => setMetricId(metric.id)}
              className={`${chipSize} ${active ? chipOn : chipOff}`}
            >
              {metric.name}
            </button>
          );
        })}
      </div>

      {selected.percent ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {labels.sampleNote}
        </p>
      ) : null}

      <ol className="mt-3 rounded-xl border-[0.5px] border-border bg-card px-3">
        {ranked.map((player, index) => {
          const cell = player.cells[selected.id];
          const width = selected.percent
            ? Math.min(100, Math.max(0, cell.value))
            : Math.round((cell.value / maxValue) * 100);
          return (
            <li
              key={player.userId}
              className="border-b-[0.5px] border-border py-3 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <span className="w-4 text-center text-xs text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground"
                >
                  {player.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium leading-tight">
                    {player.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {player.teamName}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-lg font-medium leading-tight tabular-nums">
                    {cell.display}
                  </span>
                  {cell.detail ? (
                    <span className="block text-xs text-muted-foreground tabular-nums">
                      {cell.detail}
                    </span>
                  ) : null}
                </span>
              </div>
              <div className="mt-2 ml-7 h-1.5 rounded-full bg-secondary">
                <div
                  className={`h-1.5 rounded-full ${
                    index === 0 ? 'bg-primary' : 'bg-accent-foreground/30'
                  }`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </li>
          );
        })}
        {lowSample.map((player) => {
          const cell = player.cells[selected.id];
          return (
            <li
              key={player.userId}
              className="flex items-center gap-3 border-b-[0.5px] border-border py-3 text-muted-foreground last:border-b-0"
            >
              <span className="w-4" />
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium"
              >
                {player.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate leading-tight">
                  {player.name}
                </span>
                <span className="block truncate text-xs">
                  {player.teamName}
                </span>
              </span>
              <span className="text-right text-xs tabular-nums">
                {cell.display}
                <span className="block">{labels.lowSample}</span>
              </span>
            </li>
          );
        })}
        {ranked.length === 0 && lowSample.length === 0 ? (
          <li className="py-4 text-center text-sm text-muted-foreground">
            {labels.noData}
          </li>
        ) : null}
      </ol>

      <button
        type="button"
        aria-expanded={showFull}
        onClick={() => setShowFull((value) => !value)}
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full border-[0.5px] border-border bg-card text-sm font-medium text-foreground hover:bg-secondary md:hidden"
      >
        {showFull ? labels.fullHide : labels.fullShow}
        <ChevronDown
          className={`size-4 ${showFull ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <div
        className={`${showFull ? 'block' : 'hidden'} mt-3 overflow-x-auto rounded-xl border-[0.5px] border-border bg-card md:block`}
      >
        <table
          className="w-max min-w-full text-sm"
          aria-label={labels.tableAria}
        >
          <thead>
            <tr className="border-b-[0.5px] border-border text-xs text-muted-foreground">
              <th
                scope="col"
                className="sticky left-0 z-10 min-w-36 border-r-[0.5px] border-border bg-card px-3 py-2 text-left font-medium"
              >
                {labels.player}
              </th>
              <th
                scope="col"
                title={labels.games.full}
                className="min-w-12 px-2 py-2 text-center font-medium"
              >
                {labels.games.short}
              </th>
              {metrics.map((metric) => (
                <th
                  key={metric.id}
                  scope="col"
                  title={metric.name}
                  className="min-w-14 px-2 py-2 text-center font-medium"
                >
                  {metric.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr
                key={player.userId}
                className="border-b-[0.5px] border-border last:border-b-0"
              >
                <td className="sticky left-0 z-10 border-r-[0.5px] border-border bg-card px-3 py-2">
                  <span className="block whitespace-nowrap font-medium leading-tight">
                    {player.name}
                  </span>
                  <span className="block whitespace-nowrap text-xs text-muted-foreground">
                    {player.teamName}
                  </span>
                </td>
                <td className="px-2 py-2 text-center tabular-nums">
                  {player.games}
                </td>
                {metrics.map((metric) => {
                  const cell = player.cells[metric.id];
                  return (
                    <td
                      key={metric.id}
                      className="px-2 py-2 text-center tabular-nums"
                    >
                      {cell ? cell.display : '—'}
                      {cell?.detail && metric.percent ? (
                        <span className="block text-xs text-muted-foreground">
                          {cell.detail}
                        </span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
