import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { TeamAvatar } from '@/components/teams/TeamAvatar';
import type { DashboardTeams } from '@/lib/home/dashboard';
import {
  CardEmpty,
  CardMessage,
  DashboardCard,
  primaryLinkClass,
  secondaryLinkClass,
} from './DashboardCard';

export async function MyTeamsCard({ teams }: { teams: DashboardTeams | null }) {
  const { t } = await getT('home');
  const lng = await routeLanguage();

  const cardProps = {
    title: t('dashboard.teams.title'),
    href: `/${lng}/teams?mine=1`,
    linkLabel: t('dashboard.teams.viewAll'),
  };

  if (teams === null) {
    return (
      <DashboardCard {...cardProps}>
        <CardMessage>{t('dashboard.error')}</CardMessage>
      </DashboardCard>
    );
  }

  if (teams.items.length === 0) {
    return (
      <DashboardCard {...cardProps}>
        <CardEmpty
          message={t('dashboard.teams.empty')}
          actions={
            <>
              <Link href={`/${lng}/teams`} className={primaryLinkClass}>
                {t('dashboard.teams.find')}
              </Link>
              <Link href={`/${lng}/teams/new`} className={secondaryLinkClass}>
                {t('dashboard.teams.create')}
              </Link>
            </>
          }
        />
      </DashboardCard>
    );
  }

  const hidden = teams.total - teams.items.length;

  return (
    <DashboardCard {...cardProps}>
      <ul>
        {teams.items.map((team) => (
          <li
            key={team.id}
            className="flex items-center gap-3 border-t-[0.5px] border-border py-3 first:border-t-0 first:pt-0"
          >
            <TeamAvatar name={team.name} logoUrl={team.logoUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <Link
                href={`/${lng}/teams/${team.id}`}
                className="block truncate font-medium text-foreground hover:underline"
              >
                {team.name}
              </Link>
              <p className="truncate text-sm text-muted-foreground">
                {team.sport} ·{' '}
                {t('dashboard.teams.members', {
                  count: team.memberCount,
                  max: team.maxMembers,
                })}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                {t(`dashboard.teams.role.${team.role}`)}
              </span>
              {team.pendingRequests > 0 ? (
                <Link
                  href={`/${lng}/teams/${team.id}/manage`}
                  className="rounded-full bg-terracotta px-2.5 py-0.5 text-xs font-medium text-white hover:opacity-90"
                >
                  {t('dashboard.teams.requests', {
                    count: team.pendingRequests,
                  })}
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {hidden > 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {t('dashboard.teams.more', { count: hidden })}
        </p>
      ) : null}
    </DashboardCard>
  );
}
