import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { Award } from 'lucide-react';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { TournamentCard } from '@/components/tournaments/TournamentCard';
import { TournamentsEmpty } from '@/components/tournaments/TournamentsEmpty';
import { TournamentsFilters } from '@/components/tournaments/TournamentsFilters';
import type { SearchParams } from '@/lib/fields/filters';
import { getCurrentUser } from '@/lib/session';
import {
  TOURNAMENT_SPORTS,
  TOURNAMENT_STATUSES,
} from '@/lib/tournaments/tournament';
import {
  hasActiveTournamentFilters,
  parseTournamentFilters,
} from '@/lib/tournaments/tournament-filters';
import { loadTournamentList } from '@/lib/tournaments/tournament-loader';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('tournaments');
  return { title: t('meta.title'), description: t('meta.description') };
}

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { t } = await getT('tournaments');
  const { t: tf } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();
  const params = await searchParams;
  const legacyMine = Array.isArray(params.mine) ? params.mine[0] : params.mine;
  if (legacyMine === '1') {
    redirect(`/${lng}/${user ? 'tournaments/mine' : 'login'}`);
  }
  const filters = parseTournamentFilters(params);
  const tournaments = await loadTournamentList(filters, lng);

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-360 flex-1 px-4 py-6 sm:px-6 md:py-10 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1>{t('page.title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('page.subtitle')}</p>
          </div>
          {user ? (
            <Link
              href={`/${lng}/tournaments/mine`}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary sm:px-5"
            >
              <Award className="size-4" aria-hidden="true" />
              {t('page.mine')}
            </Link>
          ) : null}
        </div>

        <div className="mt-6 md:mt-8">
          <TournamentsFilters
            filters={filters}
            sports={TOURNAMENT_SPORTS.map((value) => ({
              value,
              label: tf(`sports.${value}`),
            }))}
            statuses={TOURNAMENT_STATUSES.map((value) => ({
              value,
              label: t(`status.${value}`),
            }))}
            labels={{
              sportLabel: t('filters.sportLabel'),
              sportAll: t('filters.sportAll'),
              statusLabel: t('filters.statusLabel'),
              statusAll: t('filters.statusAll'),
            }}
          />
        </div>

        <div className="mt-6">
          {tournaments.length === 0 ? (
            <TournamentsEmpty
              hasFilters={hasActiveTournamentFilters(filters)}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {tournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
