import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { TRPCError } from '@trpc/server';
import { ArrowLeft } from 'lucide-react';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import {
  SlotsManager,
  type SlotsManagerLabels,
} from '@/components/owner/slots/SlotsManager';
import { formatDayChip } from '@/lib/fields/detail-format';
import {
  parseFieldFilters,
  todayInAthens,
  tomorrowInAthens,
  type SearchParams,
} from '@/lib/fields/filters';
import { toOwnerSlotItem, type OwnerSlotRow } from '@/lib/fields/owner-slots';
import type { OwnerFieldEditRow } from '@/lib/fields/owner';
import { localized } from '@/lib/i18n-content';
import { getCurrentUser } from '@/lib/session';
import { getServerCaller } from '@/trpc/server/caller';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('fields');
  return { title: t('owner.slots.meta') };
}

export default async function OwnerSlotsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { t } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  const today = todayInAthens();
  const tomorrow = tomorrowInAthens();
  const selectedDay = parseFieldFilters({ date: query.date }).date ?? today;

  let field: OwnerFieldEditRow;
  try {
    const caller = await getServerCaller();
    field = await caller.fieldOwner.getForEdit({ id });
  } catch (error) {
    if (error instanceof TRPCError && error.code === 'NOT_FOUND') notFound();
    throw error;
  }

  const approved = field.status === 'APPROVED';

  let rows: OwnerSlotRow[] | null = null;
  if (approved) {
    try {
      const caller = await getServerCaller();
      rows = await caller.fieldOwner.listSlots({
        fieldId: id,
        date: selectedDay,
      });
    } catch (error) {
      console.error('[OwnerSlotsPage]', error);
    }
  }

  const sports = field.sports.map((value) => ({
    value,
    label: t(`sports.${value}`),
  }));

  const slots = (rows ?? []).map((row) =>
    toOwnerSlotItem(row, lng, t(`sports.${row.sportType}`)),
  );

  const labels: SlotsManagerLabels = {
    dateBar: {
      date: t('filters.date'),
      today: t('filters.today'),
      tomorrow: t('filters.tomorrow'),
    },
    list: {
      heading: t('owner.slots.list.heading'),
      empty: t('owner.slots.list.empty'),
      statusOpen: t('owner.slots.list.statusOpen'),
      statusPending: t('owner.slots.list.statusPending'),
      statusBooked: t('owner.slots.list.statusBooked'),
      delete: t('owner.slots.list.delete'),
      working: t('owner.slots.list.working'),
    },
    form: {
      title: t('owner.slots.form.title'),
      date: t('owner.slots.form.date'),
      start: t('owner.slots.form.start'),
      end: t('owner.slots.form.end'),
      sport: t('owner.slots.form.sport'),
      price: t('owner.slots.form.price'),
      pricePlaceholder: t('owner.slots.form.pricePlaceholder'),
      submit: t('owner.slots.form.submit'),
      submitting: t('owner.slots.form.submitting'),
      errorDate: t('owner.slots.form.errorDate'),
      errorStart: t('owner.slots.form.errorStart'),
      errorEnd: t('owner.slots.form.errorEnd'),
      errorOrder: t('owner.slots.form.errorOrder'),
      errorPast: t('owner.slots.form.errorPast'),
      errorSport: t('owner.slots.form.errorSport'),
      errorPrice: t('owner.slots.form.errorPrice'),
      errorOverlap: t('owner.slots.form.errorOverlap'),
      errorInvalid: t('owner.slots.form.errorInvalid'),
      errorGeneric: t('owner.slots.form.errorGeneric'),
    },
    deleteConflict: t('owner.slots.deleteConflict'),
    deleteError: t('owner.slots.deleteError'),
  };

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <Link
          href={`/${lng}/owner/fields`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('owner.slots.back')}
        </Link>

        <h1 className="mt-3">{t('owner.slots.title')}</h1>
        <p className="mt-2 text-muted-foreground">
          {localized(field.name, lng)}
        </p>

        <div className="mt-6 md:mt-8">
          {!approved ? (
            <div className="rounded-xl border-[0.5px] border-border bg-card p-6 text-center">
              <h2 className="text-lg">{t('owner.slots.notApproved.title')}</h2>
              <p className="mt-1 text-muted-foreground">
                {t('owner.slots.notApproved.description')}
              </p>
            </div>
          ) : rows === null ? (
            <div className="rounded-xl border-[0.5px] border-border bg-card p-6 text-center">
              <h2 className="text-lg">{t('owner.slots.error.title')}</h2>
              <p className="mt-1 text-muted-foreground">
                {t('owner.slots.error.description')}
              </p>
            </div>
          ) : (
            <SlotsManager
              fieldId={field.id}
              selectedDay={selectedDay}
              today={today}
              tomorrow={tomorrow}
              dayLabel={formatDayChip(selectedDay, lng).full}
              slots={slots}
              sports={sports}
              labels={labels}
            />
          )}
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
