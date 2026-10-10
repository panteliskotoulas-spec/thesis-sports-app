import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { Plus } from 'lucide-react';
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
  tomorrowInAthens,
  type SearchParams,
} from '@/lib/fields/filters';
import { SPORT_TYPES } from '@/lib/fields/types';
import { getCurrentUser } from '@/lib/session';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('fields');
  return { title: t('meta.title') };
}

function formatDayLabel(day: string, lng: string): string {
  return new Intl.DateTimeFormat(lng, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${day}T00:00:00Z`));
}

export default async function FieldsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { t } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();
  const filters = parseFieldFilters(await searchParams);

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
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <Link
                href={`/${lng}/owner/fields`}
                className="inline-flex h-11 items-center justify-center rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary sm:px-5"
              >
                {t('owner.title')}
              </Link>
              <Link
                href={`/${lng}/owner/fields/new`}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 sm:px-5"
              >
                <Plus className="size-4" aria-hidden="true" />
                {t('new.cta')}
              </Link>
            </div>
          ) : null}
        </div>

        <div className="mt-6 md:mt-8">
          <FieldsFilters
            filters={filters}
            today={todayInAthens()}
            tomorrow={tomorrowInAthens()}
            dateLabel={filters.date ? formatDayLabel(filters.date, lng) : null}
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
              filtersButton: t('filters.filtersButton'),
              sheetTitle: t('filters.sheetTitle'),
              sheetDescription: t('filters.sheetDescription'),
              apply: t('filters.apply'),
              reset: t('filters.reset'),
              close: t('filters.close'),
              today: t('filters.today'),
              tomorrow: t('filters.tomorrow'),
              remove: t('filters.remove'),
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
