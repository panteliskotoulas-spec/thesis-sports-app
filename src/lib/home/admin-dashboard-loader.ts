import 'server-only';

import {
  ADMIN_ONGOING_LIMIT,
  ADMIN_PENDING_TOURNAMENTS_LIMIT,
  type AdminDashboardData,
} from '@/lib/home/admin-dashboard';
import { formatTournamentDates } from '@/lib/tournaments/tournament-format';
import { getServerCaller } from '@/trpc/server/caller';

export interface LoadAdminDashboardInput {
  lng: string;
  sportLabel: (sport: string) => string;
}

async function safe<T>(
  label: string,
  run: () => Promise<T>,
): Promise<T | null> {
  try {
    return await run();
  } catch (error) {
    console.error(`[loadAdminDashboard:${label}]`, error);
    return null;
  }
}

export async function loadAdminDashboard({
  lng,
  sportLabel,
}: LoadAdminDashboardInput): Promise<AdminDashboardData | null> {
  try {
    const caller = await getServerCaller();

    const [pending, ongoing] = await Promise.all([
      safe('pending', () => caller.dashboard.adminPending()),
      safe('ongoing', () =>
        caller.tournaments.list({
          lng: lng === 'en' ? 'en' : 'el',
          sport: null,
          status: 'ONGOING',
        }),
      ),
    ]);

    return {
      pending: pending
        ? {
            fields: pending.fields,
            coaches: pending.coaches,
            tournamentRequests: pending.tournamentRequests,
            total:
              pending.fields + pending.coaches + pending.tournamentRequests,
            tournaments: pending.tournaments.slice(
              0,
              ADMIN_PENDING_TOURNAMENTS_LIMIT,
            ),
            hiddenTournaments: Math.max(
              0,
              pending.tournaments.length - ADMIN_PENDING_TOURNAMENTS_LIMIT,
            ),
          }
        : null,
      ongoing: ongoing
        ? {
            items: ongoing.slice(0, ADMIN_ONGOING_LIMIT).map((tournament) => ({
              id: tournament.id,
              name: tournament.name,
              sport: sportLabel(tournament.sport),
              dates: formatTournamentDates(
                tournament.startDate,
                tournament.endDate,
                lng,
              ),
              teamCount: tournament.teamCount,
              maxTeams: tournament.maxTeams,
            })),
            total: ongoing.length,
          }
        : null,
    };
  } catch (error) {
    console.error('[loadAdminDashboard]', error);
    return null;
  }
}
