import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import type { DashboardTournament } from '@/lib/home/dashboard';
import {
  CardEmpty,
  CardMessage,
  DashboardCard,
  secondaryLinkClass,
} from './DashboardCard';

export async function TournamentsCard({
  tournaments,
  className,
}: {
  tournaments: DashboardTournament[] | null;
  className?: string;
}) {
  const { t } = await getT('home');
  const { t: tt } = await getT('tournaments');
  const lng = await routeLanguage();

  const cardProps = {
    title: t('dashboard.tournaments.title'),
    href: `/${lng}/tournaments`,
    linkLabel: t('dashboard.tournaments.viewAll'),
    className,
  };

  if (tournaments === null) {
    return (
      <DashboardCard {...cardProps}>
        <CardMessage>{t('dashboard.error')}</CardMessage>
      </DashboardCard>
    );
  }

  if (tournaments.length === 0) {
    return (
      <DashboardCard {...cardProps}>
        <CardEmpty
          message={t('dashboard.tournaments.empty')}
          actions={
            <Link href={`/${lng}/tournaments`} className={secondaryLinkClass}>
              {t('dashboard.tournaments.cta')}
            </Link>
          }
        />
      </DashboardCard>
    );
  }

  return (
    <DashboardCard {...cardProps}>
      <ul>
        {tournaments.map((tournament) => (
          <li
            key={tournament.id}
            className="flex items-center gap-3 border-t-[0.5px] border-border py-3 first:border-t-0 first:pt-0"
          >
            <div className="min-w-0 flex-1">
              <Link
                href={`/${lng}/tournaments/${tournament.id}`}
                className="block truncate font-medium text-foreground hover:underline"
              >
                {tournament.name}
              </Link>
              <p className="truncate text-sm text-muted-foreground">
                {tournament.sport} · {tournament.dates}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.tournaments.teams', {
                  count: tournament.teamCount,
                  max: tournament.maxTeams,
                })}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                tournament.status === 'ONGOING'
                  ? 'bg-terracotta/15 text-terracotta'
                  : 'bg-accent text-accent-foreground'
              }`}
            >
              {tt(`status.${tournament.status}`)}
            </span>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
