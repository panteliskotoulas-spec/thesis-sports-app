import { lng as routeLanguage } from 'next/root-params';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { getT } from '@/i18n.server';
import type { TournamentDetail } from '@/lib/tournaments/tournament';
import { formatTournamentDates } from '@/lib/tournaments/tournament-format';
import { STATUS_STYLES } from './statusStyles';

export async function TournamentHeader({
  tournament,
}: {
  tournament: TournamentDetail;
}) {
  const { t } = await getT('tournaments');
  const { t: tf } = await getT('fields');
  const lng = await routeLanguage();

  return (
    <header>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
          {tf(`sports.${tournament.sport}`)}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[tournament.status]}`}
        >
          {t(`status.${tournament.status}`)}
        </span>
      </div>
      <h1 className="mt-3">{tournament.name}</h1>
      <div className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-5">
        <p className="flex items-center gap-1.5">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          {tournament.fieldName}
        </p>
        <p className="flex items-center gap-1.5">
          <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
          {formatTournamentDates(tournament.startDate, tournament.endDate, lng)}
        </p>
        <p className="flex items-center gap-1.5">
          <Users className="size-4 shrink-0" aria-hidden="true" />
          {t('detail.teams', {
            current: tournament.teamCount,
            max: tournament.maxTeams,
          })}
        </p>
      </div>
      {tournament.description ? (
        <p className="mt-4 whitespace-pre-line text-muted-foreground">
          {tournament.description}
        </p>
      ) : null}
    </header>
  );
}
