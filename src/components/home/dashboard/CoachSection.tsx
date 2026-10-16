import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import type {
  CoachDashboardData,
  CoachDashboardEntry,
} from '@/lib/home/coach-dashboard';
import {
  CardEmpty,
  CardMessage,
  DashboardCard,
  primaryLinkClass,
  secondaryLinkClass,
} from './DashboardCard';

function EntryList({ items }: { items: CoachDashboardEntry[] }) {
  return (
    <ul>
      {items.map((entry) => (
        <li
          key={entry.id}
          className="border-t-[0.5px] border-border py-3 first:border-t-0 first:pt-0"
        >
          <p className="truncate font-medium text-foreground">
            {entry.requesterName}
          </p>
          <p className="mt-1 text-foreground">{entry.when}</p>
          {entry.teamName ? (
            <p className="mt-2">
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                {entry.teamName}
              </span>
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export async function CoachSection({ data }: { data: CoachDashboardData }) {
  const { t } = await getT('home');
  const lng = await routeLanguage();
  const base = `/${lng}/coaches`;

  if (data.status !== 'APPROVED') {
    const rejected = data.status === 'REJECTED';

    return (
      <section className="mt-6">
        <p className="text-sm font-medium text-muted-foreground">
          {t('dashboard.coach.title')}
        </p>
        <div className="mt-3 rounded-xl border-[0.5px] border-border bg-card p-4 sm:p-5">
          <h2 className={`text-lg ${rejected ? 'text-terracotta' : ''}`}>
            {rejected
              ? t('dashboard.coach.rejected.title')
              : t('dashboard.coach.pending.title')}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {rejected
              ? t('dashboard.coach.rejected.description')
              : t('dashboard.coach.pending.description')}
          </p>
          {rejected && data.rejectionReason ? (
            <p className="mt-2 text-foreground">
              {t('dashboard.coach.rejected.reason', {
                reason: data.rejectionReason,
              })}
            </p>
          ) : null}
          <div className="mt-4">
            <Link
              href={`${base}/apply`}
              className={rejected ? primaryLinkClass : secondaryLinkClass}
            >
              {rejected
                ? t('dashboard.coach.rejected.cta')
                : t('dashboard.coach.pending.cta')}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const { requests, sessions, openSlots } = data;
  const requestsHidden = requests ? requests.total - requests.items.length : 0;
  const sessionsHidden = sessions ? sessions.total - sessions.items.length : 0;

  return (
    <section className="mt-6">
      <p className="text-sm font-medium text-muted-foreground">
        {t('dashboard.coach.title')}
      </p>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        <DashboardCard
          title={t('dashboard.coach.requests.title')}
          href={`${base}/requests`}
          linkLabel={t('dashboard.coach.requests.viewAll')}
        >
          {requests === null ? (
            <CardMessage>{t('dashboard.error')}</CardMessage>
          ) : requests.items.length === 0 ? (
            <CardEmpty message={t('dashboard.coach.requests.empty')} />
          ) : (
            <>
              <EntryList items={requests.items} />
              {requestsHidden > 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('dashboard.coach.requests.more', {
                    count: requestsHidden,
                  })}
                </p>
              ) : null}
            </>
          )}
        </DashboardCard>

        <DashboardCard
          title={t('dashboard.coach.sessions.title')}
          href={`${base}/requests`}
          linkLabel={t('dashboard.coach.sessions.viewAll')}
        >
          {sessions === null ? (
            <CardMessage>{t('dashboard.error')}</CardMessage>
          ) : (
            <>
              {sessions.items.length === 0 ? (
                <CardEmpty message={t('dashboard.coach.sessions.empty')} />
              ) : (
                <EntryList items={sessions.items} />
              )}
              {sessionsHidden > 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('dashboard.coach.sessions.more', {
                    count: sessionsHidden,
                  })}
                </p>
              ) : null}
              {sessions.awaitingPayment > 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('dashboard.coach.sessions.awaitingPayment', {
                    count: sessions.awaitingPayment,
                  })}
                </p>
              ) : null}
            </>
          )}
        </DashboardCard>

        <DashboardCard title={t('dashboard.coach.availability.title')}>
          {openSlots === null ? (
            <CardMessage>{t('dashboard.error')}</CardMessage>
          ) : (
            <CardEmpty
              message={
                openSlots > 0
                  ? t('dashboard.coach.availability.open', {
                      count: openSlots,
                    })
                  : t('dashboard.coach.availability.none')
              }
              actions={
                <Link
                  href={`${base}/slots`}
                  className={
                    openSlots > 0 ? secondaryLinkClass : primaryLinkClass
                  }
                >
                  {t('dashboard.coach.availability.cta')}
                </Link>
              }
            />
          )}
        </DashboardCard>
      </div>
    </section>
  );
}
