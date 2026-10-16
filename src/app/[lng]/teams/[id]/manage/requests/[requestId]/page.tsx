import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { ArrowLeft } from 'lucide-react';
import { TRPCError } from '@trpc/server';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { PlayerStatsView } from '@/components/stats/PlayerStatsView';
import { ApplicantActions } from '@/components/teams/ApplicantActions';
import { TeamAvatar } from '@/components/teams/TeamAvatar';
import { fillTemplate } from '@/lib/bookings/booking';
import { formatRelativeTime } from '@/lib/notifications/notification';
import { getCurrentUser } from '@/lib/session';
import { EMPTY_PLAYER_STATS } from '@/lib/stats/player-stats';
import { buildStatsLabels } from '@/lib/stats/stats-labels';
import { toJoinRequestItem } from '@/lib/teams/team';
import { isTournamentSport } from '@/lib/tournaments/tournament';
import { getServerCaller } from '@/trpc/server/caller';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('teams');
  return { title: t('manage.applicant.meta') };
}

export default async function ApplicantStatsPage({
  params,
}: {
  params: Promise<{ id: string; requestId: string }>;
}) {
  const { id, requestId } = await params;
  const { t } = await getT('teams');
  const { t: tf } = await getT('fields');
  const { t: tt } = await getT('tournaments');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  const caller = await getServerCaller();
  let data;
  try {
    data = await caller.teams.getById({ id });
  } catch (error) {
    if (error instanceof TRPCError && error.code === 'NOT_FOUND') notFound();
    throw error;
  }
  if (data.viewer.kind !== 'leader') redirect(`/${lng}/teams/${id}`);

  const team = data.team;
  if (!isTournamentSport(team.sportType)) notFound();

  const requests = await caller.teams.joinRequests({ teamId: id });
  const row = requests.find((item) => item.id === requestId);
  if (!row) notFound();
  const request = toJoinRequestItem(row);

  const backHref = `/${lng}/teams/${team.id}/manage`;
  const statsLabels = buildStatsLabels(tt);
  const labels = {
    ...statsLabels,
    empty: {
      title: t('manage.applicant.emptyTitle'),
      description: t('manage.applicant.emptyDescription'),
      cta: null,
    },
  };
  const subtitle = fillTemplate(t('manage.applicant.subtitle'), {
    team: team.name,
    time: formatRelativeTime(
      request.createdAt,
      new Date(),
      lng,
      t('manage.justNow'),
    ),
  });

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <Link
          href={backHref}
          className="inline-flex h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('manage.applicant.back')}
        </Link>

        <div className="mt-2 flex items-center gap-3">
          <TeamAvatar
            name={request.name}
            logoUrl={request.avatarUrl}
            size="md"
          />
          <div className="min-w-0">
            <h1 className="wrap-break-word">{request.name}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="mt-4 max-w-md">
          <ApplicantActions
            requestId={request.id}
            backHref={backHref}
            full={team.members.length >= team.maxMembers}
            labels={{
              accept: t('manage.accept'),
              reject: t('manage.reject'),
              full: t('manage.requestsFull'),
              errorConflict: t('manage.errorConflict'),
              errorGeneric: t('manage.errorGeneric'),
            }}
          />
        </div>

        <h2 className="mb-3 mt-8 text-lg">
          {t('manage.applicant.statsTitle', {
            sport: tf(`sports.${team.sportType}`),
          })}
        </h2>
        <PlayerStatsView data={EMPTY_PLAYER_STATS} labels={labels} lng={lng} />
      </main>
      <BottomNav user={user} />
    </>
  );
}
