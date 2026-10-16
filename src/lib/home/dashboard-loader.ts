import 'server-only';

import { formatAmount } from '@/lib/bookings/booking';
import { splitBookingRows, toBookingItem } from '@/lib/bookings/booking-rows';
import { toCoachSessionItem } from '@/lib/coaches/coach-session';
import { formatDayChip, formatTimeRange } from '@/lib/fields/detail-format';
import { todayInAthens } from '@/lib/fields/filters';
import { localized } from '@/lib/i18n-content';
import {
  DASHBOARD_ACTIONS_LIMIT,
  DASHBOARD_JOIN_REQUESTS_LIMIT,
  DASHBOARD_SESSIONS_LIMIT,
  DASHBOARD_TEAMS_LIMIT,
  DASHBOARD_TOURNAMENTS_LIMIT,
  type DashboardAction,
  type DashboardActions,
  type DashboardBookings,
  type DashboardCoaching,
  type DashboardTeams,
  type DashboardTournamentEntry,
  type PlayerDashboardData,
} from '@/lib/home/dashboard';
import type { TournamentStatus } from '@/lib/tournaments/tournament';
import { formatTournamentDates } from '@/lib/tournaments/tournament-format';
import { getServerCaller } from '@/trpc/server/caller';

export interface LoadPlayerDashboardInput {
  lng: string;
  sportLabel: (sport: string) => string;
}

const TOURNAMENT_RANK: Record<TournamentStatus, number> = {
  ONGOING: 0,
  UPCOMING: 1,
  COMPLETED: 2,
};

async function safe<T>(
  label: string,
  run: () => Promise<T>,
): Promise<T | null> {
  try {
    return await run();
  } catch (error) {
    console.error(`[loadPlayerDashboard:${label}]`, error);
    return null;
  }
}

export async function loadPlayerDashboard({
  lng,
  sportLabel,
}: LoadPlayerDashboardInput): Promise<PlayerDashboardData> {
  const caller = await getServerCaller();
  const now = new Date();

  const [
    reservations,
    myTeams,
    sessions,
    tournaments,
    stats,
    pendingSplits,
    myJoinRequests,
    tournamentEntries,
  ] = await Promise.all([
    safe('reservations', () => caller.reservations.listMine()),
    safe('teams', () => caller.teams.myTeams()),
    safe('coaching', () => caller.coachSessions.listMine()),
    safe('tournaments', () =>
      caller.tournaments.listMine({
        lng: lng === 'en' ? 'en' : 'el',
        sport: null,
        status: null,
      }),
    ),
    safe('stats', () => caller.stats.mine()),
    safe('pendingSplits', () => caller.dashboard.pendingSplits()),
    safe('myJoinRequests', () => caller.dashboard.myJoinRequests()),
    safe('tournamentEntries', () => caller.dashboard.myTournamentEntries()),
  ]);

  let bookings: DashboardBookings | null = null;
  if (reservations) {
    const { upcoming } = splitBookingRows(reservations, now);
    const next = upcoming[0];
    const item = next
      ? toBookingItem(next, lng, sportLabel(next.sportType), now)
      : null;

    bookings = {
      next: item
        ? {
            id: item.id,
            fieldName: item.fieldName,
            fieldHref: item.fieldHref,
            sport: item.sport,
            date: item.date,
            time: item.time,
            teamName: item.teamName,
          }
        : null,
      upcomingCount: upcoming.length,
    };
  }

  let teams: DashboardTeams | null = null;
  if (myTeams) {
    const visible = [...myTeams]
      .sort((a, b) => Number(b.role === 'LEADER') - Number(a.role === 'LEADER'))
      .slice(0, DASHBOARD_TEAMS_LIMIT);

    const requestCounts = await Promise.all(
      visible.map(async (team) => {
        if (team.role !== 'LEADER') return 0;
        const requests = await safe('joinRequests', () =>
          caller.teams.joinRequests({ teamId: team.id }),
        );
        return requests?.length ?? 0;
      }),
    );

    const requestRows = myJoinRequests ?? [];

    teams = {
      joinRequests: requestRows
        .slice(0, DASHBOARD_JOIN_REQUESTS_LIMIT)
        .map((request) => ({
          id: request.id,
          teamId: request.teamId,
          name: request.teamName,
          logoUrl: request.logoUrl,
          sport: sportLabel(request.sportType),
        })),
      joinRequestsTotal: requestRows.length,
      total: myTeams.length,
      items: visible.map((team, index) => ({
        id: team.id,
        name: team.name,
        logoUrl: team.logoUrl,
        sport: sportLabel(team.sportType),
        role: team.role,
        memberCount: team.memberCount,
        maxMembers: team.maxMembers,
        pendingRequests: requestCounts[index],
      })),
    };
  }

  let coaching: DashboardCoaching | null = null;
  if (sessions) {
    const upcomingRows = sessions.rows
      .filter((row) => row.state === 'CONFIRMED' && row.endTime > now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    coaching = {
      upcoming: upcomingRows.slice(0, DASHBOARD_SESSIONS_LIMIT).map((row) => {
        const item = toCoachSessionItem(
          row,
          lng,
          sportLabel(row.sportType),
          now,
        );
        return {
          id: item.id,
          coachName: item.coachName,
          coachHref: item.coachHref,
          sport: item.sport,
          date: item.date,
          time: item.time,
          teamName: item.teamName,
        };
      }),
      upcomingCount: upcomingRows.length,
      requestedCount: sessions.rows.filter((row) => row.state === 'REQUESTED')
        .length,
    };
  }

  const entriesByTournament = new Map<string, DashboardTournamentEntry[]>();
  for (const row of tournamentEntries ?? []) {
    const list = entriesByTournament.get(row.tournamentId) ?? [];
    list.push({
      teamId: row.teamId,
      teamName: row.teamName,
      state: row.state,
    });
    entriesByTournament.set(row.tournamentId, list);
  }

  const tournamentItems = tournaments
    ? tournaments
        .filter((tournament) => tournament.status !== 'COMPLETED')
        .sort(
          (a, b) =>
            TOURNAMENT_RANK[a.status] - TOURNAMENT_RANK[b.status] ||
            a.startDate.localeCompare(b.startDate),
        )
        .slice(0, DASHBOARD_TOURNAMENTS_LIMIT)
        .map((tournament) => ({
          id: tournament.id,
          name: tournament.name,
          sport: sportLabel(tournament.sport),
          status: tournament.status,
          dates: formatTournamentDates(
            tournament.startDate,
            tournament.endDate,
            lng,
          ),
          teamCount: tournament.teamCount,
          maxTeams: tournament.maxTeams,
          entries: [...(entriesByTournament.get(tournament.id) ?? [])].sort(
            (a, b) =>
              Number(a.state === 'PENDING') - Number(b.state === 'PENDING') ||
              a.teamName.localeCompare(b.teamName),
          ),
        }))
    : null;

  let actions: DashboardActions | null = null;
  if (pendingSplits !== null || sessions !== null) {
    const paymentActions = (sessions?.rows ?? [])
      .filter((row) => row.state === 'AWAITING_PAYMENT')
      .sort(
        (a, b) =>
          (a.payBy ?? a.startTime).getTime() -
          (b.payBy ?? b.startTime).getTime(),
      )
      .map((row): DashboardAction => {
        const item = toCoachSessionItem(
          row,
          lng,
          sportLabel(row.sportType),
          now,
        );
        return {
          key: `session-payment-${row.id}`,
          kind: 'SESSION_PAYMENT',
          title: item.coachName,
          context: item.teamName,
          when: item.payBy ?? `${item.date}, ${item.time}`,
          amount: item.total,
          href: `/${lng}/coaching`,
        };
      });

    const splitActions = (pendingSplits ?? []).map(
      (split): DashboardAction => ({
        key: `${split.kind}-${split.id}`,
        kind:
          split.kind === 'RESERVATION' ? 'RESERVATION_SPLIT' : 'SESSION_SPLIT',
        title: localized(split.title, lng),
        context: split.teamName,
        when: `${formatDayChip(todayInAthens(split.startTime), lng).full}, ${formatTimeRange(split.startTime, split.endTime, lng)}`,
        amount: formatAmount(split.amount, lng),
        href:
          split.kind === 'RESERVATION'
            ? `/${lng}/teams/${split.teamId}/split/${split.id}`
            : `/${lng}/teams/${split.teamId}/session-split/${split.id}`,
      }),
    );

    const all = [...paymentActions, ...splitActions];
    actions = {
      total: all.length,
      items: all.slice(0, DASHBOARD_ACTIONS_LIMIT),
    };
  }

  return {
    actions,
    bookings,
    teams,
    coaching,
    tournaments: tournamentItems,
    stats: stats
      ? { matches: stats.matches.length, tournaments: stats.tournaments.length }
      : null,
  };
}
