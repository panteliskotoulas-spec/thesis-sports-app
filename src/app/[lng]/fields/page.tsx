import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getT } from '@/i18n.server';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { FieldsFilters } from '@/components/fields/FieldsFilters';
import { FieldsList } from '@/components/fields/FieldsList';
import { FieldsGridSkeleton } from '@/components/fields/FieldCardSkeleton';
import {
  buildFieldsQuery,
  parseFieldFilters,
  todayInAthens,
  type SearchParams,
} from '@/lib/fields/filters';
import { SPORT_TYPES } from '@/lib/fields/types';
import { getCurrentUser } from '@/lib/session';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('fields');
  return { title: t('meta.title') };
}

export default async function FieldsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { t } = await getT('fields');
  const user = await getCurrentUser();
  const filters = parseFieldFilters(await searchParams);

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-360 flex-1 px-4 py-6 sm:px-6 md:py-10 lg:px-8">
        <h1>{t('page.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('page.subtitle')}</p>

        <div className="mt-6 md:mt-8">
          <FieldsFilters
            filters={filters}
            today={todayInAthens()}
            sports={SPORT_TYPES.map((value) => ({
              value,
              label: t(`sports.${value}`),
            }))}
            labels={{
              search: t('filters.search'),
              searchLabel: t('filters.searchLabel'),
              date: t('filters.date'),
              clearDate: t('filters.clearDate'),
              typeLabel: t('filters.typeLabel'),
              typeAll: t('filters.typeAll'),
              typeOutdoor: t('filters.typeOutdoor'),
              typeIndoor: t('filters.typeIndoor'),
              sportLabel: t('filters.sportLabel'),
              sportAll: t('filters.sportAll'),
            }}
          />
        </div>

        <div className="mt-6">
          <Suspense
            key={buildFieldsQuery(filters)}
            fallback={<FieldsGridSkeleton />}
          >
            <FieldsList filters={filters} />
          </Suspense>
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
