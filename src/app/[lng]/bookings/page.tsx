import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { AlertTriangle } from 'lucide-react';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import {
  BookingsList,
  type BookingsListLabels,
} from '@/components/bookings/BookingsList';
import { splitBookingRows, toBookingItem } from '@/lib/bookings/booking-rows';
import { getCurrentUser } from '@/lib/session';
import { withMockTeamName } from '@/lib/teams/team-booking-mock';
import { getServerCaller } from '@/trpc/server/caller';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('fields');
  return { title: t('booking.list.meta') };
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ booked?: string; payment?: string; focus?: string }>;
}) {
  const query = await searchParams;
  const { t } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  const caller = await getServerCaller();
  const rows = withMockTeamName(await caller.reservations.listMine());

  const now = new Date();
  const { upcoming, past } = splitBookingRows(rows, now);

  const toItem = (row: (typeof rows)[number]) =>
    toBookingItem(row, lng, t(`sports.${row.sportType}`), now);

  const labels: BookingsListLabels = {
    tabUpcoming: t('booking.list.tabUpcoming'),
    tabPast: t('booking.list.tabPast'),
    emptyUpcomingTitle: t('booking.list.emptyUpcomingTitle'),
    emptyUpcomingDescription: t('booking.list.emptyUpcomingDescription'),
    emptyUpcomingAction: t('booking.list.emptyUpcomingAction'),
    emptyPastTitle: t('booking.list.emptyPastTitle'),
    emptyPastDescription: t('booking.list.emptyPastDescription'),
    bookedNotice: t('booking.list.bookedNotice'),
    cancelledNotice: t('booking.list.cancelledNotice'),
    card: {
      statusConfirmed: t('booking.card.statusConfirmed'),
      statusCompleted: t('booking.card.statusCompleted'),
      statusCancelled: t('booking.card.statusCancelled'),
      statusCancelledByOwner: t('booking.card.statusCancelledByOwner'),
      paid: t('booking.card.paid'),
      paidCard: t('booking.card.paidCard'),
      paidCredit: t('booking.card.paidCredit'),
      cancel: t('booking.card.cancel'),
      cancelLocked: t('booking.card.cancelLocked'),
      refundedCard: t('booking.card.refundedCard'),
      refundedMixed: t('booking.card.refundedMixed'),
      refundedCredit: t('booking.card.refundedCredit'),
      errorTooLate: t('booking.card.errorTooLate'),
      errorConflict: t('booking.card.errorConflict'),
      errorGeneric: t('booking.card.errorGeneric'),
      panel: {
        title: t('booking.cancel.title'),
        optionRefundTitle: t('booking.cancel.optionRefundTitle'),
        optionRefundCard: t('booking.cancel.optionRefundCard'),
        optionRefundMixed: t('booking.cancel.optionRefundMixed'),
        optionCredit: t('booking.cancel.optionCredit'),
        optionCreditTitle: t('booking.cancel.optionCreditTitle'),
        warning: t('booking.cancel.warning'),
        back: t('booking.cancel.back'),
        confirm: t('booking.cancel.confirm'),
        working: t('booking.cancel.working'),
      },
    },
  };

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <h1>{t('booking.list.title')}</h1>
        <p className="mt-2 text-muted-foreground">
          {t('booking.list.subtitle')}
        </p>

        {query.payment === 'failed' ? (
          <div
            role="alert"
            className="mt-6 flex items-start gap-2 rounded-xl border-[0.5px] border-terracotta bg-card p-4 text-sm text-foreground"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-terracotta"
              aria-hidden="true"
            />
            {t('booking.list.paymentFailed')}
          </div>
        ) : null}

        <div className="mt-6">
          <BookingsList
            upcoming={upcoming.map(toItem)}
            past={past.map(toItem)}
            browseHref={`/${lng}/fields`}
            justBooked={query.booked === '1'}
            focusId={query.focus ?? null}
            labels={labels}
          />
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
