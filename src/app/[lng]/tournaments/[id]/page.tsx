import type { Metadata } from 'next';
import Link from 'next/link';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { ArrowLeft } from 'lucide-react';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { MatchesSection } from '@/components/tournaments/MatchesSection';
import { PlayerStatsSection } from '@/components/tournaments/PlayerStatsSection';
import { PointsTrendChart } from '@/components/tournaments/PointsTrendChart';
import { StandingsTable } from '@/components/tournaments/StandingsTable';
import { TournamentHeader } from '@/components/tournaments/TournamentHeader';
import { getCurrentUser } from '@/lib/session';
import {
  computePointsTrend,
  computeStandings,
} from '@/lib/tournaments/standings';
import { loadTournamentDetail } from '@/lib/tournaments/tournament-loader';
import { buildTournamentLabels } from '@/lib/tournaments/tournament-labels';
import {
  buildMatchRows,
  buildMetricOptions,
  buildPlayerRows,
} from '@/lib/tournaments/tournament-view';

const TREND_TEAMS = 4;

const loadTournament = cache(async (id: string, lng: string) =>
  loadTournamentDetail(id, lng),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lng = await routeLanguage();
  const tournament = await loadTournament(id, lng);
  return tournament ? { title: tournament.name } : {};
}

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { t } = await getT('tournaments');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  const tournament = await loadTournament(id, lng);
  if (!tournament) notFound();

  const labels = buildTournamentLabels(t);
  const standings = computeStandings(
    tournament.sport,
    tournament.teams,
    tournament.matches,
    lng,
  );
  const trend = computePointsTrend(
    tournament.sport,
    standings,
    tournament.matches,
    TREND_TEAMS,
  );
  const matchRows = buildMatchRows(
    tournament,
    labels.matches,
    labels.metrics,
    lng,
  );
  const metricOptions = buildMetricOptions(tournament, labels.metrics);
  const playerRows = buildPlayerRows(tournament, labels.players, lng);

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 md:py-10 lg:px-8">
        <Link
          href={`/${lng}/tournaments`}
          className="mb-2 inline-flex h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('detail.back')}
        </Link>

        <TournamentHeader tournament={tournament} />

        <div
          className={`mt-8 grid grid-cols-1 gap-x-8 gap-y-8 ${
            trend ? 'lg:grid-cols-2' : ''
          }`}
        >
          <section aria-labelledby="tournament-standings-title">
            <h2 id="tournament-standings-title" className="text-lg">
              {labels.standings.title}
            </h2>
            <p className="mb-3 mt-1 text-sm text-muted-foreground">
              {labels.standings.caption}
            </p>
            {standings.length === 0 ? (
              <p className="text-muted-foreground">{labels.standings.empty}</p>
            ) : (
              <StandingsTable
                sport={tournament.sport}
                rows={standings}
                labels={labels.standings}
              />
            )}
          </section>

          {trend ? (
            <section aria-labelledby="tournament-trend-title">
              <h2 id="tournament-trend-title" className="text-lg">
                {labels.trend.title}
              </h2>
              <p className="mb-3 mt-1 text-sm text-muted-foreground">
                {labels.trend.caption}
              </p>
              <PointsTrendChart data={trend} labels={labels.trend} />
            </section>
          ) : null}
        </div>

        <section className="mt-10" aria-labelledby="tournament-matches-title">
          <h2 id="tournament-matches-title" className="text-lg">
            {labels.matches.title}
          </h2>
          <p className="mb-3 mt-1 text-sm text-muted-foreground">
            {labels.matches.caption}
          </p>
          <MatchesSection rows={matchRows} labels={labels.matches} />
        </section>

        <section className="mt-10" aria-labelledby="tournament-players-title">
          <h2 id="tournament-players-title" className="text-lg">
            {labels.players.title}
          </h2>
          <p className="mb-3 mt-1 text-sm text-muted-foreground">
            {labels.players.caption}
          </p>
          <PlayerStatsSection
            metrics={metricOptions}
            players={playerRows}
            labels={labels.players}
          />
        </section>
      </main>
      <BottomNav user={user} />
    </>
  );
}
