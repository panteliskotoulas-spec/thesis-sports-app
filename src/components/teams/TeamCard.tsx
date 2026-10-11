import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { MapPin, UserSearch, Users } from 'lucide-react';
import { getT } from '@/i18n.server';
import type { TeamListItem } from '@/lib/teams/team';
import { TeamAvatar } from './TeamAvatar';

export async function TeamCard({ team }: { team: TeamListItem }) {
  const { t } = await getT('teams');
  const { t: tf } = await getT('fields');
  const lng = await routeLanguage();

  return (
    <article className="rounded-xl border-[0.5px] border-border bg-card">
      <Link
        href={`/${lng}/teams/${team.id}`}
        className="flex h-full flex-col gap-3 rounded-xl p-4 focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        <div className="flex items-center gap-3">
          <TeamAvatar name={team.name} logoUrl={team.logoUrl} />
          <div className="min-w-0">
            <h3 className="truncate text-base">{team.name}</h3>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{team.area}</span>
            </p>
          </div>
        </div>

        <ul className="flex flex-wrap gap-1.5">
          <li className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
            {tf(`sports.${team.sportType}`)}
          </li>
          <li className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {t(`levels.${team.level}`)}
          </li>
          {team.recruiting ? (
            <li className="inline-flex items-center gap-1 rounded-full bg-terracotta/15 px-2.5 py-0.5 text-xs font-medium text-terracotta">
              <UserSearch className="size-3.5 shrink-0" aria-hidden="true" />
              {team.neededPosition
                ? t('card.looking', { position: team.neededPosition })
                : t('card.recruiting')}
            </li>
          ) : null}
        </ul>

        <p className="mt-auto flex items-center gap-1.5 border-t-[0.5px] border-border pt-3 text-sm text-muted-foreground">
          <Users className="size-3.5 shrink-0" aria-hidden="true" />
          {t('card.members', {
            current: team.memberCount,
            max: team.maxMembers,
          })}
          {team.full ? ` · ${t('card.full')}` : ''}
        </p>
      </Link>
    </article>
  );
}
