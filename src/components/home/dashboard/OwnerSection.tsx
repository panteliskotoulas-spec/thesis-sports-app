import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import type { OwnerDashboardData } from '@/lib/home/owner-dashboard';
import {
  CardEmpty,
  CardMessage,
  DashboardCard,
  primaryLinkClass,
  secondaryLinkClass,
} from './DashboardCard';

function CountRow({
  label,
  count,
  tone = 'default',
}: {
  label: string;
  count: number;
  tone?: 'default' | 'alert';
}) {
  return (
    <li className="flex items-center justify-between gap-3 border-t-[0.5px] border-border py-2 first:border-t-0 first:pt-0">
      <span className="text-foreground">{label}</span>
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          tone === 'alert' && count > 0
            ? 'bg-terracotta/15 text-terracotta'
            : 'bg-secondary text-foreground'
        }`}
      >
        {count}
      </span>
    </li>
  );
}

export async function OwnerSection({ data }: { data: OwnerDashboardData }) {
  const { t } = await getT('home');
  const lng = await routeLanguage();
  const base = `/${lng}/owner`;
  const { fields, bookings, withoutSlots } = data;

  const newField = (className: string) => (
    <Link href={`${base}/fields/new`} className={className}>
      {t('dashboard.owner.fields.cta')}
    </Link>
  );

  const bookingsHidden = bookings ? bookings.total - bookings.items.length : 0;
  const withoutSlotsHidden = withoutSlots
    ? withoutSlots.total - withoutSlots.items.length
    : 0;

  return (
    <section className="mt-6">
      <p className="text-sm font-medium text-muted-foreground">
        {t('dashboard.owner.title')}
      </p>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        <DashboardCard
          title={t('dashboard.owner.fields.title')}
          href={`${base}/fields`}
          linkLabel={t('dashboard.owner.fields.viewAll')}
        >
          {fields === null ? (
            <CardMessage>{t('dashboard.error')}</CardMessage>
          ) : fields.total === 0 ? (
            <CardEmpty
              message={t('dashboard.owner.fields.empty')}
              actions={newField(primaryLinkClass)}
            />
          ) : (
            <>
              <ul>
                <CountRow
                  label={t('dashboard.owner.fields.approved')}
                  count={fields.approved}
                />
                <CountRow
                  label={t('dashboard.owner.fields.pending')}
                  count={fields.pending}
                />
                <CountRow
                  label={t('dashboard.owner.fields.rejected')}
                  count={fields.rejected}
                  tone="alert"
                />
              </ul>
              <div className="mt-4">{newField(secondaryLinkClass)}</div>
            </>
          )}
        </DashboardCard>

        <DashboardCard
          title={t('dashboard.owner.bookings.title')}
          href={`${base}/bookings`}
          linkLabel={t('dashboard.owner.bookings.viewAll')}
        >
          {bookings === null ? (
            <CardMessage>{t('dashboard.error')}</CardMessage>
          ) : bookings.items.length === 0 ? (
            <CardEmpty message={t('dashboard.owner.bookings.empty')} />
          ) : (
            <>
              <ul>
                {bookings.items.map((booking) => (
                  <li
                    key={booking.id}
                    className="border-t-[0.5px] border-border py-3 first:border-t-0 first:pt-0"
                  >
                    <p className="truncate font-medium text-foreground">
                      {booking.fieldName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.sport} · {booking.playerName}
                    </p>
                    <p className="mt-1 text-foreground">{booking.when}</p>
                  </li>
                ))}
              </ul>
              {bookingsHidden > 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('dashboard.owner.bookings.more', {
                    count: bookingsHidden,
                  })}
                </p>
              ) : null}
            </>
          )}
        </DashboardCard>

        <DashboardCard title={t('dashboard.owner.noSlots.title')}>
          {withoutSlots === null ? (
            <CardMessage>{t('dashboard.error')}</CardMessage>
          ) : withoutSlots.items.length === 0 ? (
            <CardEmpty
              message={
                fields !== null && fields.approved === 0
                  ? t('dashboard.owner.noSlots.noApproved')
                  : t('dashboard.owner.noSlots.allGood')
              }
            />
          ) : (
            <>
              <p className="text-muted-foreground">
                {t('dashboard.owner.noSlots.description')}
              </p>
              <ul className="mt-3">
                {withoutSlots.items.map((field) => (
                  <li
                    key={field.id}
                    className="flex items-center justify-between gap-3 border-t-[0.5px] border-border py-2 first:border-t-0 first:pt-0"
                  >
                    <span className="min-w-0 truncate font-medium text-foreground">
                      {field.name}
                    </span>
                    <Link
                      href={`${base}/fields/${field.id}/slots`}
                      className="shrink-0 text-sm font-medium text-accent-foreground hover:underline"
                    >
                      {t('dashboard.owner.noSlots.cta')}
                    </Link>
                  </li>
                ))}
              </ul>
              {withoutSlotsHidden > 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('dashboard.owner.noSlots.more', {
                    count: withoutSlotsHidden,
                  })}
                </p>
              ) : null}
            </>
          )}
        </DashboardCard>
      </div>
    </section>
  );
}
