import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { Award, CalendarDays, MapPin, Users } from 'lucide-react';
import { getT } from '@/i18n.server';
import type { TournamentListItem } from '@/lib/tournaments/tournament';
import { formatTournamentDates } from '@/lib/tournaments/tournament-format';
import { STATUS_STYLES } from './statusStyles';

export async function TournamentCard({
  tournament,
}: {
  tournament: TournamentListItem;
}) {
  const { t } = await getT('tournaments');
  const { t: tf } = await getT('fields');
  const lng = await routeLanguage();

  return (
    <article className="rounded-xl border-[0.5px] border-border bg-card">
      <Link
        href={`/${lng}/tournaments/${tournament.id}`}
        className="flex h-full flex-col gap-3 rounded-xl p-4 focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"
          >
            <Award className="size-5" />
          </span>
          <h3 className="min-w-0 text-base">{tournament.name}</h3>
        </div>

        <ul className="flex flex-wrap gap-1.5">
          <li className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
            {tf(`sports.${tournament.sport}`)}
          </li>
          <li
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[tournament.status]}`}
          >
            {t(`status.${tournament.status}`)}
          </li>
        </ul>

        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{tournament.fieldName}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            {formatTournamentDates(
              tournament.startDate,
              tournament.endDate,
              lng,
            )}
          </p>
        </div>

        <p className="mt-auto flex items-center gap-1.5 border-t-[0.5px] border-border pt-3 text-sm text-muted-foreground">
          <Users className="size-3.5 shrink-0" aria-hidden="true" />
          {t('card.teams', {
            current: tournament.teamCount,
            max: tournament.maxTeams,
          })}
        </p>
      </Link>
    </article>
  );
}
