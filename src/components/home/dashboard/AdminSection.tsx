import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import type { AdminDashboardData } from '@/lib/home/admin-dashboard';
import { CardEmpty, CardMessage, DashboardCard } from './DashboardCard';

function CountBadge({ count }: { count: number }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        count > 0
          ? 'bg-accent text-accent-foreground'
          : 'bg-secondary text-muted-foreground'
      }`}
    >
      {count}
    </span>
  );
}

function ApprovalRow({
  href,
  label,
  count,
}: {
  href: string;
  label: string;
  count: number;
}) {
  return (
    <li className="border-t-[0.5px] border-border first:border-t-0">
      <Link
        href={href}
        className="flex items-center justify-between gap-3 py-2.5 text-foreground hover:underline"
      >
        <span>{label}</span>
        <CountBadge count={count} />
      </Link>
    </li>
  );
}

export async function AdminSection({ data }: { data: AdminDashboardData }) {
  const { t } = await getT('home');
  const lng = await routeLanguage();
  const base = `/${lng}/admin`;
  const { pending, ongoing } = data;
  const ongoingHidden = ongoing ? ongoing.total - ongoing.items.length : 0;

  return (
    <section className="mt-6">
      <p className="text-sm font-medium text-muted-foreground">
        {t('dashboard.admin.title')}
      </p>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <DashboardCard title={t('dashboard.admin.pending.title')}>
          {pending === null ? (
            <CardMessage>{t('dashboard.error')}</CardMessage>
          ) : pending.total === 0 ? (
            <CardEmpty message={t('dashboard.admin.pending.empty')} />
          ) : (
            <>
              <ul>
                <ApprovalRow
                  href={`${base}/fields?status=PENDING`}
                  label={t('dashboard.admin.pending.fields')}
                  count={pending.fields}
                />
                <ApprovalRow
                  href={`${base}/coaches?status=PENDING`}
                  label={t('dashboard.admin.pending.coaches')}
                  count={pending.coaches}
                />
                <ApprovalRow
                  href={`${base}/tournaments`}
                  label={t('dashboard.admin.pending.tournamentRequests')}
                  count={pending.tournamentRequests}
                />
              </ul>
              {pending.tournaments.length > 0 ? (
                <ul className="mt-1 border-t-[0.5px] border-border pt-2">
                  {pending.tournaments.map((tournament) => (
                    <li key={tournament.id}>
                      <Link
                        href={`${base}/tournaments/${tournament.id}`}
                        className="flex items-center justify-between gap-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
                      >
                        <span className="min-w-0 truncate">
                          {tournament.name}
                        </span>
                        <CountBadge count={tournament.count} />
                      </Link>
                    </li>
                  ))}
                  {pending.hiddenTournaments > 0 ? (
                    <li className="py-1.5 text-sm text-muted-foreground">
                      {t('dashboard.admin.pending.more', {
                        count: pending.hiddenTournaments,
                      })}
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </>
          )}
        </DashboardCard>

        <DashboardCard
          title={t('dashboard.admin.ongoing.title')}
          href={`${base}/tournaments?status=ONGOING`}
          linkLabel={t('dashboard.admin.ongoing.viewAll')}
        >
          {ongoing === null ? (
            <CardMessage>{t('dashboard.error')}</CardMessage>
          ) : ongoing.items.length === 0 ? (
            <CardEmpty message={t('dashboard.admin.ongoing.empty')} />
          ) : (
            <>
              <ul>
                {ongoing.items.map((tournament) => (
                  <li
                    key={tournament.id}
                    className="border-t-[0.5px] border-border py-3 first:border-t-0 first:pt-0"
                  >
                    <Link
                      href={`${base}/tournaments/${tournament.id}`}
                      className="block truncate font-medium text-foreground hover:underline"
                    >
                      {tournament.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {tournament.sport} · {tournament.dates}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('dashboard.tournaments.teams', {
                        count: tournament.teamCount,
                        max: tournament.maxTeams,
                      })}
                    </p>
                  </li>
                ))}
              </ul>
              {ongoingHidden > 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('dashboard.admin.ongoing.more', { count: ongoingHidden })}
                </p>
              ) : null}
            </>
          )}
        </DashboardCard>
      </div>
    </section>
  );
}
