import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { ArrowLeft } from 'lucide-react';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import {
  CoachSlotsManager,
  type CoachSlotsManagerLabels,
} from '@/components/coaches/slots/CoachSlotsManager';
import { toCoachSlotItem, type CoachSlotRow } from '@/lib/coaches/coach-public';
import { formatDayChip } from '@/lib/fields/detail-format';
import {
  parseFieldFilters,
  todayInAthens,
  tomorrowInAthens,
  type SearchParams,
} from '@/lib/fields/filters';
import { getCurrentUser } from '@/lib/session';
import { getServerCaller } from '@/trpc/server/caller';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('coaches');
  return { title: t('slots.meta') };
}

export default async function CoachSlotsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const { t } = await getT('coaches');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  const caller = await getServerCaller();
  const record = await caller.coaches.getMine();
  const approved = record?.status === 'APPROVED';

  const today = todayInAthens();
  const tomorrow = tomorrowInAthens();
  const selectedDay = parseFieldFilters({ date: query.date }).date ?? today;

  let rows: CoachSlotRow[] | null = null;
  if (approved) {
    try {
      rows = await caller.coachSlots.list({ date: selectedDay });
    } catch (error) {
      console.error('[CoachSlotsPage]', error);
    }
  }

  const slots = (rows ?? []).map((row) => toCoachSlotItem(row, lng));

  const labels: CoachSlotsManagerLabels = {
    dateBar: {
      date: t('slots.dateBar.date'),
      today: t('slots.dateBar.today'),
      tomorrow: t('slots.dateBar.tomorrow'),
    },
    list: {
      heading: t('slots.list.heading'),
      empty: t('slots.list.empty'),
      statusOpen: t('slots.list.statusOpen'),
      statusPending: t('slots.list.statusPending'),
      statusBooked: t('slots.list.statusBooked'),
      delete: t('slots.list.delete'),
      working: t('slots.list.working'),
    },
    form: {
      title: t('slots.form.title'),
      date: t('slots.form.date'),
      start: t('slots.form.start'),
      end: t('slots.form.end'),
      price: t('slots.form.price'),
      pricePlaceholder: t('slots.form.pricePlaceholder'),
      submit: t('slots.form.submit'),
      submitting: t('slots.form.submitting'),
      errorDate: t('slots.form.errorDate'),
      errorStart: t('slots.form.errorStart'),
      errorEnd: t('slots.form.errorEnd'),
      errorOrder: t('slots.form.errorOrder'),
      errorPast: t('slots.form.errorPast'),
      errorPrice: t('slots.form.errorPrice'),
      errorOverlap: t('slots.form.errorOverlap'),
      errorInvalid: t('slots.form.errorInvalid'),
      errorGeneric: t('slots.form.errorGeneric'),
    },
    deleteConflict: t('slots.deleteConflict'),
    deleteError: t('slots.deleteError'),
  };

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <Link
          href={`/${lng}/coaches/apply`}
          className="inline-flex h-10 items-center gap-2 text-sm font-medium text-muted-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('slots.back')}
        </Link>

        <h1 className="mt-2">{t('slots.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('slots.subtitle')}</p>

        <div className="mt-6 md:mt-8">
          {!record || !approved ? (
            <div className="rounded-xl border-[0.5px] border-border bg-card p-6 text-center">
              <h2 className="text-lg">{t('slots.notApproved.title')}</h2>
              <p className="mt-1 text-muted-foreground">
                {t('slots.notApproved.description')}
              </p>
              <Link
                href={`/${lng}/coaches/apply`}
                className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                {t('slots.notApproved.cta')}
              </Link>
            </div>
          ) : rows === null ? (
            <div className="rounded-xl border-[0.5px] border-border bg-card p-6 text-center">
              <h2 className="text-lg">{t('slots.error.title')}</h2>
              <p className="mt-1 text-muted-foreground">
                {t('slots.error.description')}
              </p>
            </div>
          ) : (
            <CoachSlotsManager
              key={selectedDay}
              sportType={record.sportType}
              selectedDay={selectedDay}
              today={today}
              tomorrow={tomorrow}
              dayLabel={formatDayChip(selectedDay, lng).full}
              slots={slots}
              labels={labels}
            />
          )}
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
