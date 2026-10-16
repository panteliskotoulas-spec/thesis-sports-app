import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { PlayerStatsView } from '@/components/stats/PlayerStatsView';
import { getCurrentUser } from '@/lib/session';
import { buildStatsLabels } from '@/lib/stats/stats-labels';
import { loadPlayerStats } from '@/lib/stats/stats-loader';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('tournaments');
  return { title: t('stats.meta.title') };
}

export default async function StatsPage() {
  const { t } = await getT('tournaments');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  const labels = buildStatsLabels(t);
  const data = await loadPlayerStats();

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <h1>{t('stats.page.title')}</h1>
        <p className="mb-6 mt-2 text-muted-foreground">
          {t('stats.page.subtitle')}
        </p>
        <PlayerStatsView data={data} labels={labels} lng={lng} />
      </main>
      <BottomNav user={user} />
    </>
  );
}
