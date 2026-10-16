'use client';

import { fillTemplate } from '@/lib/bookings/booking';
import {
  STAT_DIGITS,
  digitsOnly,
  playerBasketballPoints,
  type PlayerFormState,
  type PointsSummary,
  type ResultPlayerRow,
  type StatColumn,
} from '@/lib/tournaments/result-form';

export interface ResultColumnLabel {
  name: string;
  short: string;
}

export interface ResultTeamTableLabels {
  player: string;
  playersHint: string;
  playedAria: string;
  formerPlayer: string;
  noMembers: string;
  tableAria: string;
  pairHint: string;
  made: string;
  attempts: string;
  pointsOk: string;
  pointsMismatch: string;
  pointsOnly: string;
  columns: Record<string, ResultColumnLabel>;
}

export interface ResultTeamTableProps {
  teamName: string;
  rows: ResultPlayerRow[];
  columns: StatColumn[];
  players: Record<string, PlayerFormState>;
  summary: PointsSummary | null;
  labels: ResultTeamTableLabels;
  onToggle: (userId: string) => void;
  onStat: (userId: string, key: string, value: string) => void;
}

const statInputClass =
  'h-9 w-12 rounded-md border-[0.5px] border-input bg-background px-1 text-center tabular-nums text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40';

function summaryText(
  summary: PointsSummary,
  labels: ResultTeamTableLabels,
): string {
  const values = {
    sum: String(summary.sum),
    score: summary.score === null ? '' : String(summary.score),
  };
  if (summary.score === null) return fillTemplate(labels.pointsOnly, values);
  return fillTemplate(
    summary.matches ? labels.pointsOk : labels.pointsMismatch,
    values,
  );
}

export function ResultTeamTable({
  teamName,
  rows,
  columns,
  players,
  summary,
  labels,
  onToggle,
  onStat,
}: ResultTeamTableProps) {
  return (
    <section
      aria-label={teamName}
      className="rounded-xl border-[0.5px] border-border bg-card p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base">{teamName}</h3>
        {summary ? (
          <p
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              summary.matches
                ? 'bg-accent text-accent-foreground'
                : 'bg-terracotta/15 text-terracotta'
            }`}
          >
            {summaryText(summary, labels)}
          </p>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 text-muted-foreground">{labels.noMembers}</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            {labels.playersHint}
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-sm">
              <caption className="sr-only">
                {fillTemplate(labels.tableAria, { team: teamName })}
              </caption>
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th
                    scope="col"
                    className="sticky left-0 z-10 bg-card py-2 pr-3 font-medium"
                  >
                    {labels.player}
                  </th>
                  {columns.map((column) => {
                    const label = labels.columns[column.id];
                    const isPair = column.keys.length === 2;
                    return (
                      <th
                        key={column.id}
                        scope="col"
                        title={label?.name}
                        className="px-1 py-2 text-center font-medium"
                      >
                        <span className="block">{label?.short}</span>
                        {isPair ? (
                          <span className="block font-normal">
                            {labels.pairHint}
                          </span>
                        ) : null}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const entry = players[row.userId];
                  const included = entry?.included ?? false;
                  const name = row.former ? labels.formerPlayer : row.name;
                  return (
                    <tr
                      key={row.userId}
                      className="border-t-[0.5px] border-border"
                    >
                      <th
                        scope="row"
                        className="sticky left-0 z-10 bg-card py-2 pr-3 text-left font-normal"
                      >
                        <label className="flex min-w-36 cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={included}
                            onChange={() => onToggle(row.userId)}
                            aria-label={fillTemplate(labels.playedAria, {
                              name,
                            })}
                            className="size-4 accent-primary"
                          />
                          <span>{name}</span>
                        </label>
                      </th>
                      {columns.map((column) => {
                        const label = labels.columns[column.id];
                        if (column.computed) {
                          return (
                            <td
                              key={column.id}
                              className="px-1 py-2 text-center font-medium tabular-nums"
                            >
                              {included && entry
                                ? playerBasketballPoints(entry.stats)
                                : '–'}
                            </td>
                          );
                        }
                        return (
                          <td key={column.id} className="px-1 py-2">
                            <div className="flex items-center justify-center gap-1">
                              {column.keys.map((key, index) => {
                                const suffix =
                                  column.keys.length === 2
                                    ? index === 0
                                      ? labels.made
                                      : labels.attempts
                                    : '';
                                return (
                                  <span
                                    key={key}
                                    className="flex items-center gap-1"
                                  >
                                    {index === 1 ? (
                                      <span
                                        aria-hidden="true"
                                        className="text-muted-foreground"
                                      >
                                        /
                                      </span>
                                    ) : null}
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      autoComplete="off"
                                      disabled={!included}
                                      value={entry?.stats[key] ?? ''}
                                      onChange={(event) =>
                                        onStat(
                                          row.userId,
                                          key,
                                          digitsOnly(
                                            event.target.value,
                                            STAT_DIGITS,
                                          ),
                                        )
                                      }
                                      aria-label={`${name}: ${label?.name ?? key}${
                                        suffix ? ` (${suffix})` : ''
                                      }`}
                                      className={statInputClass}
                                    />
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
