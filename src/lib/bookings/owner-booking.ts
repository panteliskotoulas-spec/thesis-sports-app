import {
  formatAmount,
  type BookingPhase,
  type CancelledByValue,
  type ReservationStatusValue,
} from '@/lib/bookings/booking';
import { formatDayChip, formatTimeRange } from '@/lib/fields/detail-format';
import { todayInAthens } from '@/lib/fields/filters';
import type { SportType } from '@/lib/fields/types';
import { localized, type LocalizedText } from '@/lib/i18n-content';

export interface OwnerBookingRow {
  id: string;
  fieldId: string;
  fieldName: LocalizedText;
  sportType: SportType;
  startTime: Date;
  endTime: Date;
  status: ReservationStatusValue;
  cancelledBy: CancelledByValue | null;
  playerName: string;
  total: number;
  credit: number;
}

export interface OwnerBookingItem {
  id: string;
  fieldId: string;
  fieldName: string;
  sport: string;
  date: string;
  time: string;
  playerName: string;
  status: ReservationStatusValue;
  cancelledBy: CancelledByValue | null;
  phase: BookingPhase;
  total: string;
  card: string | null;
  credit: string | null;
}

export interface OwnerFieldFilter {
  id: string;
  name: string;
}

export type OwnerCancelResult =
  | { status: 'ok' }
  | { status: 'conflict' }
  | { status: 'error' };

function isUpcoming(row: OwnerBookingRow, now: Date): boolean {
  return row.status === 'CONFIRMED' && row.endTime > now;
}

export function splitOwnerBookingRows(
  rows: OwnerBookingRow[],
  now: Date = new Date(),
): { upcoming: OwnerBookingRow[]; past: OwnerBookingRow[] } {
  const upcoming = rows
    .filter((row) => isUpcoming(row, now))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const past = rows
    .filter((row) => !isUpcoming(row, now))
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  return { upcoming, past };
}

export function toOwnerBookingItem(
  row: OwnerBookingRow,
  lng: string,
  sportLabel: string,
  now: Date = new Date(),
): OwnerBookingItem {
  const card = Math.max(0, Math.round((row.total - row.credit) * 100) / 100);

  return {
    id: row.id,
    fieldId: row.fieldId,
    fieldName: localized(row.fieldName, lng),
    sport: sportLabel,
    date: formatDayChip(todayInAthens(row.startTime), lng).full,
    time: formatTimeRange(row.startTime, row.endTime, lng),
    playerName: row.playerName,
    status: row.status,
    cancelledBy: row.cancelledBy,
    phase: isUpcoming(row, now) ? 'upcoming' : 'past',
    total: formatAmount(row.total, lng),
    card: card > 0 ? formatAmount(card, lng) : null,
    credit: row.credit > 0 ? formatAmount(row.credit, lng) : null,
  };
}

export function listOwnerFields(
  rows: OwnerBookingRow[],
  lng: string,
): OwnerFieldFilter[] {
  const byId = new Map<string, string>();

  for (const row of rows) {
    if (!byId.has(row.fieldId)) {
      byId.set(row.fieldId, localized(row.fieldName, lng));
    }
  }

  return Array.from(byId, ([id, name]) => ({ id, name })).sort((a, b) =>
    a.name.localeCompare(b.name, lng),
  );
}
