import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { UserRoundPlus } from 'lucide-react';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { CoachesFilters } from '@/components/coaches/CoachesFilters';
import { CoachesList } from '@/components/coaches/CoachesList';
import { FieldsGridSkeleton } from '@/components/fields/FieldCardSkeleton';
import {
  buildCoachesQuery,
  parseCoachFilters,
} from '@/lib/coaches/coach-public';
import type { SearchParams } from '@/lib/fields/filters';
import { SPORT_TYPES } from '@/lib/fields/types';
import { getCurrentUser } from '@/lib/session';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('coaches');
  return { title: t('meta.list') };
}

export default async function CoachesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { t } = await getT('coaches');
  const { t: tf } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();
  const filters = parseCoachFilters(await searchParams);

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
              href={`/${lng}/coaches/apply`}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary sm:px-5"
            >
              <UserRoundPlus className="size-4" aria-hidden="true" />
              {t('page.apply')}
            </Link>
          ) : null}
        </div>

        <div className="mt-6 md:mt-8">
          <CoachesFilters
            filters={filters}
            sports={SPORT_TYPES.map((value) => ({
              value,
              label: tf(`sports.${value}`),
            }))}
            labels={{
              search: t('filters.search'),
              searchLabel: t('filters.searchLabel'),
              sportLabel: t('filters.sportLabel'),
              sportAll: t('filters.sportAll'),
            }}
          />
        </div>

        <div className="mt-6">
          <Suspense
            key={buildCoachesQuery(filters)}
            fallback={<FieldsGridSkeleton />}
          >
            <CoachesList filters={filters} />
          </Suspense>
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
