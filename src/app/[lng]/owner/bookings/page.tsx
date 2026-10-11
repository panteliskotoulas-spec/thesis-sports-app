import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import {
  OwnerBookingsList,
  type OwnerBookingsListLabels,
} from '@/components/owner/bookings/OwnerBookingsList';
import {
  listOwnerFields,
  splitOwnerBookingRows,
  toOwnerBookingItem,
  type OwnerBookingRow,
} from '@/lib/bookings/owner-booking';
import { getCurrentUser } from '@/lib/session';
import { getServerCaller } from '@/trpc/server/caller';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('fields');
  return { title: t('ownerBookings.meta') };
}

export default async function OwnerBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ field?: string }>;
}) {
  const query = await searchParams;
  const { t } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  let rows: OwnerBookingRow[] | null = null;
  try {
    const caller = await getServerCaller();
    rows = await caller.ownerBookings.list();
  } catch (error) {
    console.error('[OwnerBookingsPage]', error);
  }

  const labels: OwnerBookingsListLabels = {
    filterAll: t('ownerBookings.filterAll'),
    filterLabel: t('ownerBookings.filterLabel'),
    tabUpcoming: t('ownerBookings.tabUpcoming'),
    tabPast: t('ownerBookings.tabPast'),
    emptyUpcomingTitle: t('ownerBookings.emptyUpcomingTitle'),
    emptyUpcomingDescription: t('ownerBookings.emptyUpcomingDescription'),
    emptyPastTitle: t('ownerBookings.emptyPastTitle'),
    emptyPastDescription: t('ownerBookings.emptyPastDescription'),
    cancelledNotice: t('ownerBookings.cancelledNotice'),
    card: {
      statusConfirmed: t('ownerBookings.card.statusConfirmed'),
      statusCompleted: t('ownerBookings.card.statusCompleted'),
      statusCancelledByOwner: t('ownerBookings.card.statusCancelledByOwner'),
      statusCancelledByPlayer: t('ownerBookings.card.statusCancelledByPlayer'),
      paid: t('ownerBookings.card.paid'),
      paidCard: t('ownerBookings.card.paidCard'),
      paidCredit: t('ownerBookings.card.paidCredit'),
      cancel: t('ownerBookings.card.cancel'),
      refundedCard: t('ownerBookings.card.refundedCard'),
      refundedMixed: t('ownerBookings.card.refundedMixed'),
      refundedCredit: t('ownerBookings.card.refundedCredit'),
      errorConflict: t('ownerBookings.card.errorConflict'),
      errorGeneric: t('ownerBookings.card.errorGeneric'),
      panelTitle: t('ownerBookings.cancel.title'),
      panelBodyCard: t('ownerBookings.cancel.bodyCard'),
      panelBodyMixed: t('ownerBookings.cancel.bodyMixed'),
      panelBodyCredit: t('ownerBookings.cancel.bodyCredit'),
      panelBack: t('ownerBookings.cancel.back'),
      panelConfirm: t('ownerBookings.cancel.confirm'),
      panelWorking: t('ownerBookings.cancel.working'),
    },
  };

  const now = new Date();
  const fields = rows ? listOwnerFields(rows, lng) : [];
  const initialFieldId =
    query.field && fields.some((field) => field.id === query.field)
      ? query.field
      : null;

  const { upcoming, past } = rows
    ? splitOwnerBookingRows(rows, now)
    : { upcoming: [], past: [] };

  const toItem = (row: OwnerBookingRow) =>
    toOwnerBookingItem(row, lng, t(`sports.${row.sportType}`), now);

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <h1>{t('ownerBookings.title')}</h1>
        <p className="mt-2 text-muted-foreground">
          {t('ownerBookings.subtitle')}
        </p>

        <div className="mt-6">
          {rows === null ? (
            <div className="rounded-xl border-[0.5px] border-border bg-card p-6 text-center">
              <h2 className="text-lg">{t('ownerBookings.error.title')}</h2>
              <p className="mt-1 text-muted-foreground">
                {t('ownerBookings.error.description')}
              </p>
            </div>
          ) : (
            <OwnerBookingsList
              upcoming={upcoming.map(toItem)}
              past={past.map(toItem)}
              fields={fields}
              initialFieldId={initialFieldId}
              labels={labels}
            />
          )}
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
