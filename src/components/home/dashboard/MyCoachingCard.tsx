import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import type { DashboardCoaching } from '@/lib/home/dashboard';
import {
  CardEmpty,
  CardMessage,
  DashboardCard,
  primaryLinkClass,
} from './DashboardCard';

export async function MyCoachingCard({
  coaching,
}: {
  coaching: DashboardCoaching | null;
}) {
  const { t } = await getT('home');
  const lng = await routeLanguage();

  const cardProps = {
    title: t('dashboard.coaching.title'),
    href: `/${lng}/coaching`,
    linkLabel: t('dashboard.coaching.viewAll'),
  };

  if (coaching === null) {
    return (
      <DashboardCard {...cardProps}>
        <CardMessage>{t('dashboard.error')}</CardMessage>
      </DashboardCard>
    );
  }

  const findCoach = (
    <Link href={`/${lng}/coaches`} className={primaryLinkClass}>
      {t('dashboard.coaching.cta')}
    </Link>
  );

  if (coaching.upcoming.length === 0) {
    return (
      <DashboardCard {...cardProps}>
        <CardEmpty
          message={
            coaching.requestedCount > 0
              ? t('dashboard.coaching.onlyRequested', {
                  count: coaching.requestedCount,
                })
              : t('dashboard.coaching.empty')
          }
          actions={findCoach}
        />
      </DashboardCard>
    );
  }

  const hidden = coaching.upcomingCount - coaching.upcoming.length;

  return (
    <DashboardCard {...cardProps}>
      <ul>
        {coaching.upcoming.map((session) => (
          <li
            key={session.id}
            className="border-t-[0.5px] border-border py-3 first:border-t-0 first:pt-0"
          >
            <Link
              href={session.coachHref}
              className="block truncate font-medium text-foreground hover:underline"
            >
              {session.coachName}
            </Link>
            <p className="text-sm text-muted-foreground">{session.sport}</p>
            <p className="mt-1 text-foreground">
              {session.date}, {session.time}
            </p>
            {session.teamName ? (
              <p className="mt-2">
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                  {session.teamName}
                </span>
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      {hidden > 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {t('dashboard.coaching.more', { count: hidden })}
        </p>
      ) : null}
      {coaching.requestedCount > 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {t('dashboard.coaching.requested', {
            count: coaching.requestedCount,
          })}
        </p>
      ) : null}
    </DashboardCard>
  );
}
