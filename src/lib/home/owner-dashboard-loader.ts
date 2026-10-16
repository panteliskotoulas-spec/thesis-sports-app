import 'server-only';

import { formatDayChip, formatTimeRange } from '@/lib/fields/detail-format';
import { todayInAthens } from '@/lib/fields/filters';
import { localized } from '@/lib/i18n-content';
import {
  OWNER_BOOKINGS_LIMIT,
  OWNER_NO_SLOTS_LIMIT,
  type OwnerDashboardData,
} from '@/lib/home/owner-dashboard';
import { getServerCaller } from '@/trpc/server/caller';

export interface LoadOwnerDashboardInput {
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
    console.error(`[loadOwnerDashboard:${label}]`, error);
    return null;
  }
}

export async function loadOwnerDashboard({
  lng,
  sportLabel,
}: LoadOwnerDashboardInput): Promise<OwnerDashboardData | null> {
  try {
    const caller = await getServerCaller();

    const [fieldRows, bookingRows, withoutSlotsRows] = await Promise.all([
      safe('fields', () => caller.fieldOwner.list()),
      safe('bookings', () => caller.ownerBookings.list()),
      safe('withoutSlots', () => caller.dashboard.ownerFieldsWithoutSlots()),
    ]);

    const now = new Date();

    const active = fieldRows?.filter((row) => row.archivedAt === null) ?? null;

    const upcoming = bookingRows
      ? bookingRows
          .filter((row) => row.status === 'CONFIRMED' && row.endTime > now)
          .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      : null;

    return {
      fields: active
        ? {
            approved: active.filter((row) => row.status === 'APPROVED').length,
            pending: active.filter((row) => row.status === 'PENDING').length,
            rejected: active.filter((row) => row.status === 'REJECTED').length,
            total: active.length,
          }
        : null,
      bookings: upcoming
        ? {
            items: upcoming.slice(0, OWNER_BOOKINGS_LIMIT).map((row) => ({
              id: row.id,
              fieldName: localized(row.fieldName, lng),
              playerName: row.playerName,
              sport: sportLabel(row.sportType),
              when: `${formatDayChip(todayInAthens(row.startTime), lng).full}, ${formatTimeRange(row.startTime, row.endTime, lng)}`,
            })),
            total: upcoming.length,
          }
        : null,
      withoutSlots: withoutSlotsRows
        ? {
            items: withoutSlotsRows
              .slice(0, OWNER_NO_SLOTS_LIMIT)
              .map((row) => ({
                id: row.id,
                name: localized(row.name, lng),
              })),
            total: withoutSlotsRows.length,
          }
        : null,
    };
  } catch (error) {
    console.error('[loadOwnerDashboard]', error);
    return null;
  }
}
