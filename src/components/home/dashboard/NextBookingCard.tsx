import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { CalendarDays, Clock } from 'lucide-react';
import { getT } from '@/i18n.server';
import type { DashboardBookings } from '@/lib/home/dashboard';
import {
  CardEmpty,
  CardMessage,
  DashboardCard,
  primaryLinkClass,
} from './DashboardCard';

export async function NextBookingCard({
  bookings,
}: {
  bookings: DashboardBookings | null;
}) {
  const { t } = await getT('home');
  const lng = await routeLanguage();

  const cardProps = {
    title: t('dashboard.bookings.title'),
    href: `/${lng}/bookings`,
    linkLabel: t('dashboard.bookings.viewAll'),
  };

  if (bookings === null) {
    return (
      <DashboardCard {...cardProps}>
        <CardMessage>{t('dashboard.error')}</CardMessage>
      </DashboardCard>
    );
  }

  const { next, upcomingCount } = bookings;

  return (
    <DashboardCard {...cardProps}>
      {next ? (
        <div>
          <Link
            href={next.fieldHref}
            className="text-base font-medium text-foreground hover:underline"
          >
            {next.fieldName}
          </Link>
          <p className="mt-1 text-muted-foreground">{next.sport}</p>
          <p className="mt-3 flex items-center gap-2 text-foreground">
            <CalendarDays
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            {next.date}
          </p>
          <p className="mt-1 flex items-center gap-2 text-foreground">
            <Clock
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            {next.time}
          </p>
          {next.teamName ? (
            <p className="mt-3">
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                {next.teamName}
              </span>
            </p>
          ) : null}
          {upcomingCount > 1 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {t('dashboard.bookings.more', { count: upcomingCount - 1 })}
            </p>
          ) : null}
        </div>
      ) : (
        <CardEmpty
          message={t('dashboard.bookings.empty')}
          actions={
            <Link href={`/${lng}/fields`} className={primaryLinkClass}>
              {t('dashboard.bookings.cta')}
            </Link>
          }
        />
      )}
    </DashboardCard>
  );
}
