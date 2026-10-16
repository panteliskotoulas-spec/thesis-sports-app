import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import type { TeamListItem } from '@/lib/teams/team';
import { TeamAvatar } from './TeamAvatar';

export interface MyTeamRowProps {
  team: TeamListItem;
  isLeader: boolean;
}

export async function MyTeamRow({ team, isLeader }: MyTeamRowProps) {
  const { t } = await getT('teams');
  const { t: tf } = await getT('fields');
  const lng = await routeLanguage();

  return (
    <li className="flex items-center gap-3 rounded-xl border-[0.5px] border-border bg-card p-3 sm:p-4">
      <TeamAvatar name={team.name} logoUrl={team.logoUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <Link
          href={`/${lng}/teams/${team.id}`}
          className="block truncate text-base text-foreground hover:underline"
        >
          {team.name}
        </Link>
        <p className="truncate text-sm text-muted-foreground">
          {tf(`sports.${team.sportType}`)} ·{' '}
          {t('card.members', {
            current: team.memberCount,
            max: team.maxMembers,
          })}
        </p>
      </div>
      {isLeader ? (
        <Link
          href={`/${lng}/teams/${team.id}/manage`}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary"
        >
          {t('join.manage')}
        </Link>
      ) : null}
    </li>
  );
}
