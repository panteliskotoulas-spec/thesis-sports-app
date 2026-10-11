import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { TRPCError } from '@trpc/server';
import { ArrowLeft, CalendarX } from 'lucide-react';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import {
  BookingSummary,
  type BookingSummaryLabels,
} from '@/components/bookings/BookingSummary';
import type { BookingSummaryRow } from '@/lib/bookings/booking-rows';
import { formatDayChip, formatTimeRange } from '@/lib/fields/detail-format';
import { todayInAthens } from '@/lib/fields/filters';
import { localized } from '@/lib/i18n-content';
import { getCurrentUser } from '@/lib/session';
import { getServerCaller } from '@/trpc/server/caller';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('fields');
  return { title: t('booking.meta') };
}

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ slot?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { t } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  const slotId = Array.isArray(query.slot) ? query.slot[0] : query.slot;
  if (!slotId) notFound();

  let row: BookingSummaryRow;
  try {
    const caller = await getServerCaller();
    row = await caller.reservations.getSummary({ slotId });
  } catch (error) {
    if (error instanceof TRPCError && error.code === 'NOT_FOUND') notFound();
    throw error;
  }

  if (row.fieldId !== id) notFound();

  const backHref = `/${lng}/fields/${id}`;

  const labels: BookingSummaryLabels = {
    credit: {
      title: t('booking.summary.credit.title'),
      available: t('booking.summary.credit.available'),
      none: t('booking.summary.credit.none'),
      toggle: t('booking.summary.credit.toggle'),
      limited: t('booking.summary.credit.limited'),
    },
    priceRow: t('booking.summary.priceRow'),
    creditRow: t('booking.summary.creditRow'),
    cardRow: t('booking.summary.cardRow'),
    totalRow: t('booking.summary.totalRow'),
    methodRow: t('booking.summary.methodRow'),
    methodCard: t('booking.summary.methodCard'),
    methodCredit: t('booking.summary.methodCredit'),
    methodMixed: t('booking.summary.methodMixed'),
    holdNote: t('booking.summary.holdNote'),
    cancelNote: t('booking.summary.cancelNote'),
    payCard: t('booking.summary.payCard'),
    confirm: t('booking.summary.confirm'),
    working: t('booking.summary.working'),
    stripeNote: t('booking.summary.stripeNote'),
    backToField: t('booking.summary.backToField'),
    errorTaken: t('booking.summary.errorTaken'),
    errorMinimum: t('booking.summary.errorMinimum'),
    errorInvalid: t('booking.summary.errorInvalid'),
    errorGeneric: t('booking.summary.errorGeneric'),
  };

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('booking.back')}
        </Link>

        <h1 className="mt-3">{t('booking.title')}</h1>

        <div className="mt-6">
          {row.available ? (
            <BookingSummary
              lng={lng}
              slotId={row.slotId}
              fieldName={localized(row.fieldName, lng)}
              sport={t(`sports.${row.sportType}`)}
              date={formatDayChip(todayInAthens(row.startTime), lng).full}
              time={formatTimeRange(row.startTime, row.endTime, lng)}
              location={row.address || null}
              price={row.price}
              balance={row.balance}
              backHref={backHref}
              labels={labels}
            />
          ) : (
            <div className="rounded-xl border-[0.5px] border-border bg-card p-6 text-center">
              <CalendarX
                className="mx-auto size-8 text-muted-foreground"
                aria-hidden="true"
              />
              <h2 className="mt-3 text-lg">{t('booking.unavailable.title')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('booking.unavailable.description')}
              </p>
              <Link
                href={backHref}
                className="mt-4 inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
              >
                {t('booking.unavailable.action')}
              </Link>
            </div>
          )}
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
