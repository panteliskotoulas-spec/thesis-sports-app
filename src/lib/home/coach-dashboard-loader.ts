import 'server-only';

import { formatDayChip, formatTimeRange } from '@/lib/fields/detail-format';
import { todayInAthens } from '@/lib/fields/filters';
import { localized } from '@/lib/i18n-content';
import {
  COACH_REQUESTS_LIMIT,
  type CoachDashboardData,
  type CoachDashboardEntry,
} from '@/lib/home/coach-dashboard';
import { DASHBOARD_SESSIONS_LIMIT } from '@/lib/home/dashboard';
import { getServerCaller } from '@/trpc/server/caller';

async function safe<T>(
  label: string,
  run: () => Promise<T>,
): Promise<T | null> {
  try {
    return await run();
  } catch (error) {
    console.error(`[loadCoachDashboard:${label}]`, error);
    return null;
  }
}

function toEntry(
  row: {
    id: string;
    requesterName: string;
    teamName: string | null;
    startTime: Date;
    endTime: Date;
  },
  lng: string,
): CoachDashboardEntry {
  return {
    id: row.id,
    requesterName: row.requesterName,
    teamName: row.teamName,
    when: `${formatDayChip(todayInAthens(row.startTime), lng).full}, ${formatTimeRange(row.startTime, row.endTime, lng)}`,
  };
}

export async function loadCoachDashboard(
  lng: string,
): Promise<CoachDashboardData | null> {
  try {
    const caller = await getServerCaller();
    const mine = await caller.coaches.getMine();

    if (!mine) return null;

    if (mine.status !== 'APPROVED') {
      const reason =
        mine.status === 'REJECTED' && mine.rejectionReason
          ? localized(mine.rejectionReason, lng)
          : '';
      return {
        status: mine.status,
        rejectionReason: reason || null,
        requests: null,
        sessions: null,
        openSlots: null,
      };
    }

    const [incoming, openSlots] = await Promise.all([
      safe('incoming', () => caller.coachSessions.listIncoming()),
      safe('openSlots', () => caller.dashboard.coachOpenSlots()),
    ]);

    const now = new Date();
    const upcoming = (incoming ?? []).filter((row) => row.endTime > now);

    const pending = upcoming.filter((row) => row.state === 'PENDING');
    const confirmed = upcoming.filter(
      (row) => row.state === 'ACCEPTED' && row.payment === 'PAID',
    );
    const awaitingPayment = upcoming.filter(
      (row) => row.state === 'ACCEPTED' && row.payment === 'AWAITING',
    );

    return {
      status: mine.status,
      rejectionReason: null,
      requests: incoming
        ? {
            items: pending
              .slice(0, COACH_REQUESTS_LIMIT)
              .map((row) => toEntry(row, lng)),
            total: pending.length,
          }
        : null,
      sessions: incoming
        ? {
            items: confirmed
              .slice(0, DASHBOARD_SESSIONS_LIMIT)
              .map((row) => toEntry(row, lng)),
            total: confirmed.length,
            awaitingPayment: awaitingPayment.length,
          }
        : null,
      openSlots,
    };
  } catch (error) {
    console.error('[loadCoachDashboard]', error);
    return null;
  }
}
