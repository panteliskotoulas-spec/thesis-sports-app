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
import { AdminDashboard } from '@/components/home/dashboard/AdminDashboard';
import { CoachSection } from '@/components/home/dashboard/CoachSection';
import { OwnerSection } from '@/components/home/dashboard/OwnerSection';
import { PlayerDashboard } from '@/components/home/dashboard/PlayerDashboard';
import { loadAdminDashboard } from '@/lib/home/admin-dashboard-loader';
import { loadCoachDashboard } from '@/lib/home/coach-dashboard-loader';
import { loadPlayerDashboard } from '@/lib/home/dashboard-loader';
import { loadFeaturedFields } from '@/lib/home/featured-fields';
import { loadOwnerDashboard } from '@/lib/home/owner-dashboard-loader';
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
  const isAdmin = Boolean(user?.isAdmin);
  const isPlayer = user !== null && !isAdmin;

  const [featuredFields, dashboard, coach, owner, admin] = await Promise.all([
    user ? Promise.resolve([]) : loadFeaturedFields(lng),
    isPlayer
      ? loadPlayerDashboard({
          lng,
          sportLabel: (sport) => tf(`sports.${sport}`),
        })
      : Promise.resolve(null),
    isPlayer ? loadCoachDashboard(lng) : Promise.resolve(null),
    isPlayer && user?.accountType === 'BUSINESS'
      ? loadOwnerDashboard({
          lng,
          sportLabel: (sport) => tf(`sports.${sport}`),
        })
      : Promise.resolve(null),
    isAdmin
      ? loadAdminDashboard({
          lng,
          sportLabel: (sport) => tf(`sports.${sport}`),
        })
      : Promise.resolve(null),
  ]);

  return (
    <>
      <Header user={user} />
      <main className="flex-1">
        {user && isAdmin ? (
          <AdminDashboard name={user.name} data={admin} />
        ) : user && dashboard ? (
          <PlayerDashboard
            name={user.name}
            data={dashboard}
            roles={
              <>
                {coach ? <CoachSection data={coach} /> : null}
                {owner ? <OwnerSection data={owner} /> : null}
              </>
            }
          />
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
      {loggedIn ? null : <Footer loggedIn={false} />}
      <BottomNav user={user} />
    </>
  );
}
