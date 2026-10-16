import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import type { DashboardStats } from '@/lib/home/dashboard';
import { CardEmpty, CardMessage, DashboardCard } from './DashboardCard';

export async function StatsCard({ stats }: { stats: DashboardStats | null }) {
  const { t } = await getT('home');
  const lng = await routeLanguage();

  const cardProps = {
    title: t('dashboard.stats.title'),
    href: `/${lng}/stats`,
    linkLabel: t('dashboard.stats.viewAll'),
  };

  if (stats === null) {
    return (
      <DashboardCard {...cardProps}>
        <CardMessage>{t('dashboard.error')}</CardMessage>
      </DashboardCard>
    );
  }

  if (stats.matches === 0) {
    return (
      <DashboardCard {...cardProps}>
        <CardEmpty message={t('dashboard.stats.empty')} />
      </DashboardCard>
    );
  }

  const figures = [
    { key: 'matches', value: stats.matches },
    { key: 'tournaments', value: stats.tournaments },
  ] as const;

  return (
    <DashboardCard {...cardProps}>
      <dl className="grid grid-cols-2 gap-3">
        {figures.map((figure) => (
          <div key={figure.key} className="rounded-lg bg-secondary p-3">
            <dt className="text-sm text-muted-foreground">
              {t(`dashboard.stats.${figure.key}`)}
            </dt>
            <dd className="text-2xl font-medium text-foreground">
              {figure.value}
            </dd>
          </div>
        ))}
      </dl>
    </DashboardCard>
  );
}
