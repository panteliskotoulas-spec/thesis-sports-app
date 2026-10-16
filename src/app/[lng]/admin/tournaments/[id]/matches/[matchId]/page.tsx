import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { ArrowLeft } from 'lucide-react';
import { getT } from '@/i18n.server';
import {
  MatchResultForm,
  type MatchResultFormLabels,
} from '@/components/admin/tournaments/MatchResultForm';
import type {
  ResultColumnLabel,
  ResultTeamTableLabels,
} from '@/components/admin/tournaments/ResultTeamTable';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { buildAdminErrorLabels } from '@/lib/tournaments/admin-labels';
import { loadMatchRoster } from '@/lib/tournaments/admin-loader';
import {
  SPORT_COLUMNS,
  buildPlayerRows,
  columnLabelKey,
  initialFormState,
  parseStoredSets,
} from '@/lib/tournaments/result-form';
import { getCurrentUser } from '@/lib/session';
import { isTournamentSport } from '@/lib/tournaments/tournament';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('tournaments');
  return { title: t('admin.result.meta') };
}

export default async function AdminMatchResultPage({
  params,
}: {
  params: Promise<{ id: string; matchId: string }>;
}) {
  const { id, matchId } = await params;
  const { t } = await getT('tournaments');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);
  if (!user.isAdmin) notFound();

  const roster = await loadMatchRoster(matchId);
  if (!roster || roster.tournament.id !== id) notFound();

  const sport = roster.tournament.sportType;
  if (!isTournamentSport(sport)) notFound();

  const homeRows = buildPlayerRows(
    roster.homeTeam.id,
    roster.members,
    roster.playerStats,
  );
  const awayRows = buildPlayerRows(
    roster.awayTeam.id,
    roster.members,
    roster.playerStats,
  );

  const completed = roster.status === 'COMPLETED';
  const initial = initialFormState(
    sport,
    [...homeRows, ...awayRows],
    completed
      ? {
          homeScore: roster.homeScore,
          awayScore: roster.awayScore,
          sets: parseStoredSets(roster.sets),
          playerStats: roster.playerStats,
        }
      : null,
  );

  const columnLabels: Record<string, ResultColumnLabel> = {};
  const columns = SPORT_COLUMNS[sport];
  for (const column of [...columns.main, ...columns.extra]) {
    const base = columnLabelKey(column.id);
    columnLabels[column.id] = {
      name: t(`${base}.name`),
      short: t(`${base}.short`),
    };
  }

  const tableLabels: ResultTeamTableLabels = {
    player: t('admin.result.player'),
    playersHint: t('admin.result.playersHint'),
    playedAria: t('admin.result.playedAria'),
    formerPlayer: t('admin.result.formerPlayer'),
    noMembers: t('admin.result.noMembers'),
    tableAria: t('admin.result.tableAria'),
    pairHint: t('admin.result.pairHint'),
    made: t('admin.result.made'),
    attempts: t('admin.result.attempts'),
    pointsOk: t('admin.result.pointsOk'),
    pointsMismatch: t('admin.result.pointsMismatch'),
    pointsOnly: t('admin.result.pointsOnly'),
    columns: columnLabels,
  };

  const labels: MatchResultFormLabels = {
    scoreTitle: t('admin.result.scoreTitle'),
    scoreAria: t('admin.result.scoreAria'),
    setsTitle: t('admin.result.setsTitle'),
    setLabel: t('admin.result.setLabel'),
    setAria: t('admin.result.setAria'),
    addSet: t('admin.result.addSet'),
    removeSet: t('admin.result.removeSet'),
    setsResult: t('admin.result.setsResult'),
    playersTitle: t('admin.result.playersTitle'),
    more: t('admin.result.more'),
    less: t('admin.result.less'),
    cancel: t('admin.result.cancel'),
    save: t('admin.result.save'),
    saving: t('admin.result.saving'),
    confirmTitle: t('admin.result.confirmTitle'),
    confirmBody: t('admin.result.confirmBody'),
    confirmYes: t('admin.result.confirmYes'),
    confirmBack: t('admin.result.confirmBack'),
    table: tableLabels,
    errors: buildAdminErrorLabels(t),
  };

  const backHref = `/${lng}/admin/tournaments/${id}`;

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('admin.result.back')}
        </Link>

        <h1 className="mt-4">
          {completed ? t('admin.result.titleEdit') : t('admin.result.title')}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {roster.tournament.name}
          {' · '}
          {completed
            ? t('admin.result.subtitleEdit')
            : t('admin.result.subtitleNew')}
        </p>

        <div className="mt-6 md:mt-8">
          <MatchResultForm
            matchId={matchId}
            sport={sport}
            home={{
              id: roster.homeTeam.id,
              name: roster.homeTeam.name,
              players: homeRows,
            }}
            away={{
              id: roster.awayTeam.id,
              name: roster.awayTeam.name,
              players: awayRows,
            }}
            initial={initial}
            replacing={completed}
            backHref={backHref}
            labels={labels}
          />
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
