'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { fillTemplate } from '@/lib/bookings/booking';
import { chipBase, chipOff, chipOn } from '@/components/fields/chipStyles';
import {
  pickDefaultSport,
  sportsWithData,
  tournamentsForSport,
  type PlayerStatsData,
} from '@/lib/stats/player-stats';
import type { StatsLabels } from '@/lib/stats/stats-labels';
import { buildStatsView } from '@/lib/stats/stats-view';
import { MIN_SAMPLE, type TournamentSport } from '@/lib/tournaments/tournament';
import { StatsBarChart } from './StatsBarChart';

export function PlayerStatsView({
  data,
  labels,
  lng,
}: {
  data: PlayerStatsData;
  labels: StatsLabels;
  lng: string;
}) {
  const sports = useMemo(() => sportsWithData(data), [data]);
  const [sport, setSport] = useState<TournamentSport | null>(() =>
    pickDefaultSport(data),
  );
  const [tournamentId, setTournamentId] = useState<string | null>(null);

  const tournaments = useMemo(
    () => (sport ? tournamentsForSport(data, sport) : []),
    [data, sport],
  );
  const view = useMemo(
    () =>
      sport ? buildStatsView(data, sport, tournamentId, labels, lng) : null,
    [data, sport, tournamentId, labels, lng],
  );

  if (!sport || !view) {
    return (
      <div className="rounded-xl border-[0.5px] border-border bg-card p-6 text-center">
        <h2 className="text-lg">{labels.empty.title}</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          {labels.empty.description}
        </p>
        <Link
          href={`/${lng}/tournaments`}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {labels.empty.cta}
        </Link>
      </div>
    );
  }

  function chooseSport(next: TournamentSport) {
    setSport(next);
    setTournamentId(null);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {sports.length > 1 ? (
          <div
            role="group"
            aria-label={labels.sportLabel}
            className="flex gap-2 overflow-x-auto pb-1"
          >
            {sports.map((value) => {
              const active = value === sport;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => chooseSport(value)}
                  className={`${chipBase} ${active ? chipOn : chipOff}`}
                >
                  {labels.sports[value]}
                </button>
              );
            })}
          </div>
        ) : null}

        {tournaments.length > 1 ? (
          <div
            role="group"
            aria-label={labels.tournamentLabel}
            className="flex gap-2 overflow-x-auto pb-1"
          >
            <button
              type="button"
              aria-pressed={tournamentId === null}
              onClick={() => setTournamentId(null)}
              className={`${chipBase} ${tournamentId === null ? chipOn : chipOff}`}
            >
              {labels.allTournaments}
            </button>
            {tournaments.map((tournament) => {
              const active = tournament.id === tournamentId;
              return (
                <button
                  key={tournament.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTournamentId(tournament.id)}
                  className={`${chipBase} ${active ? chipOn : chipOff}`}
                >
                  {tournament.name}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {view.tiles.map((tile) => (
          <div
            key={tile.id}
            className="rounded-xl border-[0.5px] border-border bg-card px-3 py-2.5"
          >
            <dt className="text-xs text-muted-foreground">{tile.label}</dt>
            <dd className="text-2xl font-medium tabular-nums">{tile.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="stats-ratios-title">
        <h2 id="stats-ratios-title" className="mb-2 text-lg">
          {labels.ratios.title}
        </h2>
        <div className="space-y-3 rounded-xl border-[0.5px] border-border bg-card p-3">
          {view.ratios.map((ratio) => (
            <div key={ratio.id}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span>{ratio.label}</span>
                <span className="tabular-nums">
                  <span className="font-medium">{ratio.display}</span>
                  {ratio.detail ? (
                    <span className="ml-1 text-muted-foreground">
                      ({ratio.detail})
                    </span>
                  ) : null}
                </span>
              </div>
              <div
                role="presentation"
                className="mt-1 h-1.5 rounded-full bg-sage/60"
              >
                <div
                  className={`h-1.5 rounded-full ${
                    ratio.lowSample ? 'bg-primary/40' : 'bg-primary'
                  }`}
                  style={{ width: `${ratio.width}%` }}
                />
              </div>
              {ratio.lowSample ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {labels.ratios.lowSample}
                </p>
              ) : null}
            </div>
          ))}
        </div>
        {view.showSampleNote ? (
          <p className="mt-2 rounded-lg bg-terracotta/15 px-3 py-2 text-xs text-terracotta">
            {fillTemplate(labels.ratios.note, { n: String(MIN_SAMPLE) })}
          </p>
        ) : null}
      </section>

      {view.chart || view.compare.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {view.chart ? (
            <section aria-labelledby="stats-chart-title">
              <h2 id="stats-chart-title" className="mb-2 text-lg">
                {view.chart.title}
              </h2>
              <StatsBarChart chart={view.chart} />
            </section>
          ) : null}

          {view.compare.length > 0 ? (
            <section aria-labelledby="stats-compare-title">
              <h2 id="stats-compare-title" className="text-lg">
                {labels.compare.title}
              </h2>
              <p className="mb-2 mt-1 text-sm text-muted-foreground">
                {labels.compare.caption}
              </p>
              <div className="rounded-xl border-[0.5px] border-border bg-card p-3">
                <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="size-2 rounded-sm bg-primary"
                    />
                    {labels.compare.mine}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="size-2 rounded-sm bg-sage"
                    />
                    {labels.compare.average}
                  </span>
                </div>
                <div className="space-y-3">
                  {view.compare.map((row) => (
                    <div key={row.id}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span>{row.label}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {row.values}
                        </span>
                      </div>
                      <div
                        className="mt-1 h-1.5 rounded-full bg-primary"
                        style={{ width: `${row.mineWidth}%` }}
                      />
                      <div
                        className="mt-1 h-1.5 rounded-full bg-sage"
                        style={{ width: `${row.averageWidth}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      <section aria-labelledby="stats-table-title">
        <h2 id="stats-table-title" className="mb-2 text-lg">
          {labels.table.title}
        </h2>
        <div className="overflow-x-auto rounded-xl border-[0.5px] border-border bg-card">
          <table
            className="w-full min-w-80 text-sm"
            aria-label={labels.table.aria}
          >
            <thead>
              <tr className="border-b-[0.5px] border-border text-xs text-muted-foreground">
                <th scope="col" className="px-3 py-2 text-left font-medium">
                  {labels.table.round}
                </th>
                <th scope="col" className="px-2 py-2 text-left font-medium">
                  {labels.table.opponent}
                </th>
                <th scope="col" className="px-2 py-2 text-center font-medium">
                  {labels.table.score}
                </th>
                {view.columns.map((column) => (
                  <th
                    key={column.id}
                    scope="col"
                    title={column.name}
                    className="px-3 py-2 text-right font-medium"
                  >
                    {column.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.rows.map((row) => (
                <tr
                  key={row.key}
                  className="border-b-[0.5px] border-border last:border-b-0"
                >
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className="block leading-tight">{row.round}</span>
                    {row.date ? (
                      <span className="block text-xs text-muted-foreground">
                        {row.date}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-2 py-2">{row.opponent}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-center tabular-nums">
                    {row.score}
                  </td>
                  {row.cells.map((cell, index) => (
                    <td
                      key={view.columns[index].id}
                      className="px-3 py-2 text-right tabular-nums"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
