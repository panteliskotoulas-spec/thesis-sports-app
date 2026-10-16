import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { Plus } from 'lucide-react';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { TeamsFilters } from '@/components/teams/TeamsFilters';
import { TeamsGridSkeleton } from '@/components/teams/TeamCardSkeleton';
import { TeamsList } from '@/components/teams/TeamsList';
import type { SearchParams } from '@/lib/fields/filters';
import { SPORT_TYPES } from '@/lib/fields/types';
import { getCurrentUser } from '@/lib/session';
import { buildTeamsQuery, parseTeamFilters } from '@/lib/teams/team-filters';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('teams');
  return { title: t('meta.title') };
}

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { t } = await getT('teams');
  const { t: tf } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();
  const parsed = parseTeamFilters(await searchParams);
  const filters = { ...parsed, mine: parsed.mine && user !== null };

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
              href={`/${lng}/teams/new`}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 sm:px-5"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t('page.create')}
            </Link>
          ) : null}
        </div>

        <div className="mt-6 md:mt-8">
          <TeamsFilters
            filters={filters}
            showMine={user !== null}
            sports={SPORT_TYPES.map((value) => ({
              value,
              label: tf(`sports.${value}`),
            }))}
            labels={{
              sportLabel: t('filters.sportLabel'),
              sportAll: t('filters.sportAll'),
              recruiting: t('filters.recruiting'),
              scopeLabel: t('filters.scopeLabel'),
              scopeAll: t('filters.scopeAll'),
              scopeMine: t('filters.scopeMine'),
            }}
          />
        </div>

        <div className="mt-6">
          <Suspense
            key={buildTeamsQuery(filters)}
            fallback={<TeamsGridSkeleton />}
          >
            <TeamsList filters={filters} />
          </Suspense>
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
