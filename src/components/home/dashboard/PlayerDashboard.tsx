import type { ReactNode } from 'react';
import { getT } from '@/i18n.server';
import type { PlayerDashboardData } from '@/lib/home/dashboard';
import { ActionNeededCard } from './ActionNeededCard';
import { MyCoachingCard } from './MyCoachingCard';
import { MyTeamsCard } from './MyTeamsCard';
import { NextBookingCard } from './NextBookingCard';
import { StatsCard } from './StatsCard';
import { TournamentsCard } from './TournamentsCard';

export interface PlayerDashboardProps {
  name: string;
  data: PlayerDashboardData;
  roles?: ReactNode;
}

export async function PlayerDashboard({
  name,
  data,
  roles,
}: PlayerDashboardProps) {
  const { t } = await getT('home');
  const firstName = name.trim().split(/\s+/)[0] || name;

  return (
    <section className="mx-auto w-full max-w-360 px-4 py-8 sm:px-6 md:py-12 lg:px-8">
      <h1>{t('dashboard.greeting', { name: firstName })}</h1>
      <p className="mt-2 text-muted-foreground">{t('dashboard.subtitle')}</p>

      {data.actions && data.actions.total > 0 ? (
        <div className="mt-6">
          <ActionNeededCard actions={data.actions} />
        </div>
      ) : null}

      {roles}

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <NextBookingCard bookings={data.bookings} />
        <MyTeamsCard teams={data.teams} />
        <MyCoachingCard coaching={data.coaching} />
        <StatsCard stats={data.stats} />
        <TournamentsCard
          tournaments={data.tournaments}
          className="md:col-span-2"
        />
      </div>
    </section>
  );
}
