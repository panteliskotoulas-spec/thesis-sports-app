import type { Metadata } from 'next';
import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { ArrowLeft, MapPin, UserSearch } from 'lucide-react';
import { TRPCError } from '@trpc/server';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { TeamAvatar } from '@/components/teams/TeamAvatar';
import { TeamJoinButton } from '@/components/teams/TeamJoinButton';
import { TeamMembersList } from '@/components/teams/TeamMembersList';
import { TeamReservations } from '@/components/teams/TeamReservations';
import { getCurrentUser } from '@/lib/session';
import { formatTeamSince, toTeamDetailItem } from '@/lib/teams/team';
import { toTeamReservationItem } from '@/lib/teams/team-booking';
import { getMockTeamSplit } from '@/lib/teams/team-split-mock';
import {
  buildTeamJoinLabels,
  buildTeamReservationsLabels,
} from '@/lib/teams/team-labels';
import { getServerCaller } from '@/trpc/server/caller';

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

const loadTeam = cache(async (id: string) => {
  try {
    const caller = await getServerCaller();
    return await caller.teams.getById({ id });
  } catch (error) {
    if (error instanceof TRPCError && error.code === 'NOT_FOUND') return null;
    throw error;
  }
});

export async function generateMetadata({
  params,
}: TeamPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await loadTeam(id);
  return data ? { title: data.team.name } : {};
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { id } = await params;
  const { t } = await getT('teams');
  const { t: tf } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  const data = await loadTeam(id);
  if (!data) notFound();
  const team = toTeamDetailItem(data.team, lng);
  const viewer = data.viewer;

  const reservations =
    viewer.kind === 'leader' || viewer.kind === 'member'
      ? (
          await (
            await getServerCaller()
          ).teams.upcomingReservations({
            teamId: id,
          })
        ).map((row) => ({
          ...toTeamReservationItem(row, lng),
          split: getMockTeamSplit(
            viewer.kind === 'leader' ? 'leader' : 'member',
          ),
        }))
      : [];

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <Link
          href={`/${lng}/teams`}
          className="inline-flex h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('detail.back')}
        </Link>

        <section className="mt-2 rounded-xl border-[0.5px] border-border bg-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <TeamAvatar name={team.name} logoUrl={team.logoUrl} size="lg" />

            <div className="min-w-0 flex-1">
              <h1 className="wrap-break-word">{team.name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                  {team.area}
                </span>
                <span>
                  {t('detail.since', {
                    date: formatTeamSince(team.createdAt, lng),
                  })}
                </span>
              </p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                <li className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                  {tf(`sports.${team.sportType}`)}
                </li>
                <li className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {t(`levels.${team.level}`)}
                </li>
                <li className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {t('card.members', {
                    current: team.memberCount,
                    max: team.maxMembers,
                  })}
                </li>
              </ul>
            </div>

            <TeamJoinButton
              teamId={team.id}
              lng={lng}
              viewer={viewer}
              labels={buildTeamJoinLabels(t)}
            />
          </div>

          {team.description ? (
            <p className="mt-5 border-t-[0.5px] border-border pt-5">
              {team.description}
            </p>
          ) : null}

          {team.recruiting ? (
            <div className="mt-5 flex items-start gap-3 rounded-xl bg-terracotta/15 p-3 text-terracotta">
              <UserSearch
                className="mt-0.5 size-5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium">{t('detail.recruitingTitle')}</p>
                <p className="text-sm">
                  {team.neededPosition
                    ? t('detail.recruitingPosition', {
                        position: team.neededPosition,
                      })
                    : t('detail.recruitingAny')}
                </p>
              </div>
            </div>
          ) : null}
        </section>

        {viewer.kind === 'leader' || viewer.kind === 'member' ? (
          <div className="mt-4">
            <TeamReservations
              items={reservations}
              lng={lng}
              teamId={team.id}
              labels={buildTeamReservationsLabels(t)}
            />
          </div>
        ) : null}

        <div className="mt-4">
          <TeamMembersList
            members={team.members}
            title={t('detail.membersTitle')}
            leaderLabel={t('detail.leader')}
          />
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
