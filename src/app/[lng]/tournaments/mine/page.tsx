import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { ArrowLeft, Award, CircleAlert } from 'lucide-react';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { MyTournamentRow } from '@/components/tournaments/MyTournamentRow';
import { getCurrentUser } from '@/lib/session';
import { loadMyTournaments } from '@/lib/tournaments/my-tournaments-loader';
import type { TournamentStatus } from '@/lib/tournaments/tournament';
import { formatTournamentDates } from '@/lib/tournaments/tournament-format';

const SECTION_ORDER: TournamentStatus[] = ['ONGOING', 'UPCOMING', 'COMPLETED'];

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('tournaments');
  return { title: t('mine.title') };
}

export default async function MyTournamentsPage() {
  const { t } = await getT('tournaments');
  const { t: tf } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();
  if (!user) redirect(`/${lng}/login`);

  const items = await loadMyTournaments(lng);

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-360 flex-1 px-4 py-6 sm:px-6 md:py-10 lg:px-8">
        <Link
          href={`/${lng}/tournaments`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('mine.back')}
        </Link>

        <div className="mt-3 min-w-0">
          <h1>{t('mine.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('mine.subtitle')}</p>
        </div>

        <div className="mt-8 flex flex-col gap-8">
          {items === null ? (
            <div
              role="alert"
              className="flex flex-col items-center gap-3 rounded-xl border-[0.5px] border-border bg-card px-6 py-12 text-center"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                <CircleAlert className="size-6" aria-hidden="true" />
              </span>
              <p className="max-w-sm text-muted-foreground">
                {t('mine.error')}
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border-[0.5px] border-dashed border-border px-6 py-12 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Award className="size-6" aria-hidden="true" />
              </span>
              <h3>{t('mine.emptyTitle')}</h3>
              <p className="max-w-sm text-muted-foreground">
                {t('mine.emptyDescription')}
              </p>
              <Link
                href={`/${lng}/tournaments`}
                className="mt-2 inline-flex h-11 items-center rounded-full border-[0.5px] border-border bg-card px-6 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {t('mine.find')}
              </Link>
            </div>
          ) : (
            SECTION_ORDER.map((status) => {
              const group = items.filter((item) => item.status === status);
              if (group.length === 0) return null;

              return (
                <section key={status} className="flex flex-col gap-3">
                  <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    {t(`mine.sections.${status}`)}
                    <span className="rounded-full bg-secondary px-2 text-xs">
                      {group.length}
                    </span>
                  </h2>
                  <ul className="flex flex-col gap-3">
                    {group.map((item) => (
                      <MyTournamentRow
                        key={item.id}
                        name={item.name}
                        href={`/${lng}/tournaments/${item.id}`}
                        meta={`${tf(`sports.${item.sport}`)} · ${formatTournamentDates(
                          item.startDate,
                          item.endDate,
                          lng,
                        )}`}
                        entries={item.entries.map((entry) => ({
                          key: `${entry.teamId}-${entry.state}`,
                          text: t(
                            entry.state === 'PENDING'
                              ? 'mine.entryPending'
                              : 'mine.entryParticipating',
                            { team: entry.teamName },
                          ),
                          pending: entry.state === 'PENDING',
                          requestId: entry.requestId,
                          canCancel: entry.canCancel,
                        }))}
                        labels={{
                          cancel: t('mine.cancel'),
                          ask: t('mine.cancelAsk'),
                          confirm: t('mine.cancelConfirm'),
                          back: t('mine.cancelBack'),
                          cancelling: t('requests.cancelling'),
                          errorConflict: t('requests.errorConflict'),
                          errorGeneric: t('requests.errorGeneric'),
                        }}
                      />
                    ))}
                  </ul>
                </section>
              );
            })
          )}
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
