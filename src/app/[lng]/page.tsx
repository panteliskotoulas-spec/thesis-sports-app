import type { Metadata } from 'next';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeFeaturedFields } from '@/components/home/HomeFeaturedFields';
import { HomeSteps } from '@/components/home/HomeSteps';
import { HomeAudiences } from '@/components/home/HomeAudiences';
import { HomeCta } from '@/components/home/HomeCta';
import { PlayerDashboard } from '@/components/home/dashboard/PlayerDashboard';
import { loadPlayerDashboard } from '@/lib/home/dashboard-loader';
import { loadFeaturedFields } from '@/lib/home/featured-fields';
import { getCurrentUser } from '@/lib/session';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('home');
  return { title: t('meta.title'), description: t('meta.description') };
}

export default async function LandingPage() {
  const lng = await routeLanguage();
  const { t: tf } = await getT('fields');
  const user = await getCurrentUser();
  const loggedIn = user !== null;

  const [featuredFields, dashboard] = await Promise.all([
    loadFeaturedFields(lng),
    user
      ? loadPlayerDashboard({
          lng,
          sportLabel: (sport) => tf(`sports.${sport}`),
        })
      : Promise.resolve(null),
  ]);

  return (
    <>
      <Header user={user} />
      <main className="flex-1">
        {user && dashboard ? (
          <>
            <PlayerDashboard name={user.name} data={dashboard} />
            <HomeFeaturedFields fields={featuredFields} />
          </>
        ) : (
          <>
            <HomeHero loggedIn={loggedIn} />
            <HomeFeaturedFields fields={featuredFields} />
            <HomeSteps />
            <HomeAudiences />
            <HomeCta loggedIn={loggedIn} />
          </>
        )}
      </main>
      <Footer loggedIn={loggedIn} />
      <BottomNav user={user} />
    </>
  );
}
