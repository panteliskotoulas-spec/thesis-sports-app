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
import { loadFeaturedFields } from '@/lib/home/featured-fields';
import { getCurrentUser } from '@/lib/session';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('home');
  return { title: t('meta.title'), description: t('meta.description') };
}

export default async function LandingPage() {
  const lng = await routeLanguage();
  const [user, featuredFields] = await Promise.all([
    getCurrentUser(),
    loadFeaturedFields(lng),
  ]);
  const loggedIn = user !== null;

  return (
    <>
      <Header user={user} />
      <main className="flex-1">
        <HomeHero loggedIn={loggedIn} />
        <HomeFeaturedFields fields={featuredFields} />
        <HomeSteps />
        <HomeAudiences />
        <HomeCta loggedIn={loggedIn} />
      </main>
      <Footer loggedIn={loggedIn} />
      <BottomNav user={user} />
    </>
  );
}
