import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { ArrowLeft, Plus, Users } from 'lucide-react';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { MyJoinRequestRow } from '@/components/teams/MyJoinRequestRow';
import { MyTeamRow } from '@/components/teams/MyTeamRow';
import { TeamsError } from '@/components/teams/TeamsError';
import { getCurrentUser } from '@/lib/session';
import { loadMyTeams } from '@/lib/teams/my-teams-loader';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('teams');
  return { title: t('mine.title') };
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      {title}
      <span className="rounded-full bg-secondary px-2 text-xs">{count}</span>
    </h2>
  );
}

export default async function MyTeamsPage() {
  const { t } = await getT('teams');
  const { t: tf } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();
  if (!user) redirect(`/${lng}/login`);

  const data = await loadMyTeams(lng);
  const dateFormat = new Intl.DateTimeFormat(lng, {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Athens',
  });
  const isEmpty =
    data !== null &&
    data.leading.length === 0 &&
    data.member.length === 0 &&
    data.requests.length === 0;

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-360 flex-1 px-4 py-6 sm:px-6 md:py-10 lg:px-8">
        <Link
          href={`/${lng}/teams`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('mine.back')}
        </Link>

        <div className="mt-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1>{t('mine.title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('mine.subtitle')}</p>
          </div>
          <Link
            href={`/${lng}/teams/new`}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 sm:px-5"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t('page.create')}
          </Link>
        </div>

        <div className="mt-8 flex flex-col gap-8">
          {data === null ? (
            <TeamsError />
          ) : isEmpty ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border-[0.5px] border-dashed border-border px-6 py-12 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Users className="size-6" aria-hidden="true" />
              </span>
              <h3>{t('mine.emptyTitle')}</h3>
              <p className="max-w-sm text-muted-foreground">
                {t('mine.emptyDescription')}
              </p>
              <Link
                href={`/${lng}/teams`}
                className="mt-2 inline-flex h-11 items-center rounded-full border-[0.5px] border-border bg-card px-6 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {t('mine.find')}
              </Link>
            </div>
          ) : (
            <>
              {data.leading.length > 0 ? (
                <section className="flex flex-col gap-3">
                  <SectionTitle
                    title={t('mine.leader')}
                    count={data.leading.length}
                  />
                  <ul className="flex flex-col gap-3">
                    {data.leading.map((team) => (
                      <MyTeamRow key={team.id} team={team} isLeader />
                    ))}
                  </ul>
                </section>
              ) : null}

              {data.member.length > 0 ? (
                <section className="flex flex-col gap-3">
                  <SectionTitle
                    title={t('mine.member')}
                    count={data.member.length}
                  />
                  <ul className="flex flex-col gap-3">
                    {data.member.map((team) => (
                      <MyTeamRow key={team.id} team={team} isLeader={false} />
                    ))}
                  </ul>
                </section>
              ) : null}

              {data.requests.length > 0 ? (
                <section className="flex flex-col gap-3">
                  <SectionTitle
                    title={t('mine.requests')}
                    count={data.requests.length}
                  />
                  <ul className="flex flex-col gap-3">
                    {data.requests.map((request) => (
                      <MyJoinRequestRow
                        key={request.id}
                        requestId={request.id}
                        teamName={request.teamName}
                        logoUrl={request.logoUrl}
                        teamHref={`/${lng}/teams/${request.teamId}`}
                        meta={`${tf(`sports.${request.sportType}`)} · ${t(
                          'mine.sent',
                          { date: dateFormat.format(request.createdAt) },
                        )}`}
                        labels={{
                          pending: t('mine.pending'),
                          cancel: t('mine.cancel'),
                          askTitle: t('mine.cancelAsk'),
                          confirm: t('mine.cancelConfirm'),
                          back: t('mine.cancelBack'),
                          cancelling: t('join.cancelling'),
                          errorConflict: t('join.errorConflict'),
                          errorGeneric: t('join.errorGeneric'),
                        }}
                      />
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          )}
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
