import type { Metadata } from 'next';
import Link from 'next/link';
import { cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { getT } from '@/i18n.server';
import {
  AdminFixturesSection,
  type AdminFixturesSectionLabels,
  type AdminRoundGroup,
} from '@/components/admin/tournaments/AdminFixturesSection';
import {
  AdminTeamsSection,
  type AdminTeamsSectionLabels,
} from '@/components/admin/tournaments/AdminTeamsSection';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { TournamentHeader } from '@/components/tournaments/TournamentHeader';
import { fillTemplate } from '@/lib/bookings/booking';
import {
  MIN_TEAMS,
  groupByRound,
  teamsForTournament,
  teamsLocked,
  toAthensParts,
} from '@/lib/tournaments/admin';
import { loadTeamOptions } from '@/lib/tournaments/admin-loader';
import { getCurrentUser } from '@/lib/session';
import { formatMatchDate } from '@/lib/tournaments/tournament-format';
import { loadTournamentDetail } from '@/lib/tournaments/tournament-loader';

const loadTournament = cache(async (id: string, lng: string) =>
  loadTournamentDetail(id, lng),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lng = await routeLanguage();
  const tournament = await loadTournament(id, lng);
  return tournament ? { title: tournament.name } : {};
}

export default async function AdminTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { t } = await getT('tournaments');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);
  if (!user.isAdmin) notFound();

  const tournament = await loadTournament(id, lng);
  if (!tournament) notFound();

  const teamOptions = await loadTeamOptions();
  const options = teamsForTournament(
    teamOptions,
    tournament.sport,
    tournament.teams.map((team) => team.id),
  );

  const locked = teamsLocked(tournament.status, tournament.matches.length);
  const full = tournament.teams.length >= tournament.maxTeams;
  const enoughTeams = tournament.teams.length >= MIN_TEAMS;
  const hasCompleted = tournament.matches.some(
    (match) => match.status === 'COMPLETED',
  );
  const canGenerate =
    tournament.status === 'UPCOMING' &&
    tournament.matches.length === 0 &&
    enoughTeams;
  const canClear = tournament.matches.length > 0 && !hasCompleted;

  const teamNames = new Map(
    tournament.teams.map((team) => [team.id, team.name]),
  );

  const groups: AdminRoundGroup[] = groupByRound(tournament.matches).map(
    (group) => ({
      round: group.round,
      label: fillTemplate(t('matches.round'), { n: String(group.round) }),
      matches: group.matches.map((match) => {
        const parts = match.scheduledAt
          ? toAthensParts(match.scheduledAt)
          : { day: '', time: '' };
        const completed = match.status === 'COMPLETED';
        return {
          id: match.id,
          homeName: teamNames.get(match.homeTeamId) ?? '',
          awayName: teamNames.get(match.awayTeamId) ?? '',
          completed,
          scoreText:
            completed && match.homeScore !== null && match.awayScore !== null
              ? `${match.homeScore} – ${match.awayScore}`
              : null,
          whenText: match.scheduledAt
            ? formatMatchDate(match.scheduledAt, lng)
            : null,
          day: parts.day,
          time: parts.time,
        };
      }),
    }),
  );

  const teamsLabels: AdminTeamsSectionLabels = {
    title: t('admin.teams.title'),
    count: t('detail.teams', {
      current: tournament.teams.length,
      max: tournament.maxTeams,
    }),
    empty: t('admin.teams.empty'),
    lockedNote: t('admin.teams.lockedNote'),
    fullNote: t('admin.teams.fullNote'),
    addLabel: t('admin.teams.addLabel'),
    addPlaceholder: t('admin.teams.addPlaceholder'),
    noOptions: t('admin.teams.noOptions'),
    add: t('admin.teams.add'),
    removeAria: t('admin.teams.removeAria'),
  };

  const fixturesLabels: AdminFixturesSectionLabels = {
    title: t('admin.fixtures.title'),
    empty: t('admin.fixtures.empty'),
    needTeams: t('admin.fixtures.needTeams', { min: MIN_TEAMS }),
    locked: t('admin.fixtures.locked'),
    legsLabel: t('admin.fixtures.legsLabel'),
    legsOne: t('admin.fixtures.legsOne'),
    legsTwo: t('admin.fixtures.legsTwo'),
    generate: t('admin.fixtures.generate'),
    clear: t('admin.fixtures.clear'),
    clearConfirm: t('admin.fixtures.clearConfirm'),
    clearYes: t('admin.fixtures.clearYes'),
    clearNo: t('admin.fixtures.clearNo'),
    schedule: t('admin.fixtures.schedule'),
    tbd: t('matches.tbd'),
    completed: t('matches.completed'),
    dayLabel: t('admin.fixtures.dayLabel'),
    timeLabel: t('admin.fixtures.timeLabel'),
    save: t('admin.fixtures.save'),
    cancel: t('admin.fixtures.cancel'),
    versus: t('admin.fixtures.versus'),
  };

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/${lng}/admin/tournaments`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t('admin.back')}
          </Link>
          <Link
            href={`/${lng}/tournaments/${tournament.id}`}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            {t('admin.manage.publicPage')}
          </Link>
        </div>

        <div className="mt-4">
          <TournamentHeader tournament={tournament} />
        </div>

        <div className="mt-6 flex flex-col gap-4 md:mt-8 md:gap-6">
          <AdminTeamsSection
            teams={tournament.teams}
            options={options}
            locked={locked}
            full={full}
            labels={teamsLabels}
          />
          <AdminFixturesSection
            groups={groups}
            canGenerate={canGenerate}
            canClear={canClear}
            enoughTeams={enoughTeams}
            labels={fixturesLabels}
          />
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
