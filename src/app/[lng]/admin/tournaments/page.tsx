import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { Plus } from 'lucide-react';
import { getT } from '@/i18n.server';
import { AdminTournamentCard } from '@/components/admin/tournaments/AdminTournamentCard';
import { chipBase, chipOff, chipOn } from '@/components/fields/chipStyles';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { parseAdminStatus } from '@/lib/tournaments/admin';
import { getCurrentUser } from '@/lib/session';
import { TOURNAMENT_STATUSES } from '@/lib/tournaments/tournament';
import { loadTournamentList } from '@/lib/tournaments/tournament-loader';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('tournaments');
  return { title: t('admin.list.meta') };
}

export default async function AdminTournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const { t } = await getT('tournaments');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);
  if (!user.isAdmin) notFound();

  const status = parseAdminStatus((await searchParams).status);
  const tournaments = await loadTournamentList(
    { sport: null, status, mine: false },
    lng,
  );
  const basePath = `/${lng}/admin/tournaments`;

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-360 flex-1 px-4 py-6 sm:px-6 md:py-10 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1>{t('admin.list.title')}</h1>
            <p className="mt-2 text-muted-foreground">
              {t('admin.list.subtitle')}
            </p>
          </div>
          <Link
            href={`${basePath}/new`}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t('admin.list.create')}
          </Link>
        </div>

        <nav
          aria-label={t('admin.list.tabsLabel')}
          className="mt-6 flex gap-2 overflow-x-auto"
        >
          <Link
            href={basePath}
            aria-current={status === null ? 'page' : undefined}
            className={`${chipBase} ${status === null ? chipOn : chipOff}`}
          >
            {t('filters.statusAll')}
          </Link>
          {TOURNAMENT_STATUSES.map((value) => {
            const active = value === status;
            return (
              <Link
                key={value}
                href={`${basePath}?status=${value}`}
                aria-current={active ? 'page' : undefined}
                className={`${chipBase} ${active ? chipOn : chipOff}`}
              >
                {t(`status.${value}`)}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6">
          {tournaments.length === 0 ? (
            <div className="rounded-xl border-[0.5px] border-border bg-card p-6 text-center">
              <h2 className="text-lg">{t('admin.list.empty.title')}</h2>
              <p className="mt-2 text-muted-foreground">
                {t('admin.list.empty.description')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {tournaments.map((tournament) => (
                <AdminTournamentCard
                  key={tournament.id}
                  tournament={tournament}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
