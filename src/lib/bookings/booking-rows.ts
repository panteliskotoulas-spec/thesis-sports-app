import {
  canCancelBooking,
  formatAmount,
  type BookingItem,
  type CompensationValue,
  type ReservationStatusValue,
} from '@/lib/bookings/booking';
import { formatDayChip, formatTimeRange } from '@/lib/fields/detail-format';
import { todayInAthens } from '@/lib/fields/filters';
import type { SportType } from '@/lib/fields/types';
import { localized, type LocalizedText } from '@/lib/i18n-content';

export interface BookingSummaryRow {
  slotId: string;
  fieldId: string;
  fieldName: LocalizedText;
  address: string;
  startTime: Date;
  endTime: Date;
  price: number;
  sportType: SportType;
  balance: number;
  available: boolean;
}

export interface BookingRow {
  id: string;
  fieldId: string;
  fieldName: LocalizedText;
  sportType: SportType;
  startTime: Date;
  endTime: Date;
  status: ReservationStatusValue;
  compensation: CompensationValue | null;
  total: number;
  credit: number;
}

function isUpcoming(row: BookingRow, now: Date): boolean {
  return row.status === 'CONFIRMED' && row.endTime > now;
}

export function splitBookingRows(
  rows: BookingRow[],
  now: Date = new Date(),
): { upcoming: BookingRow[]; past: BookingRow[] } {
  const upcoming = rows
    .filter((row) => isUpcoming(row, now))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const past = rows
    .filter((row) => !isUpcoming(row, now))
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  return { upcoming, past };
}

export function toBookingItem(
  row: BookingRow,
  lng: string,
  sportLabel: string,
  now: Date = new Date(),
): BookingItem {
  const card = Math.max(0, Math.round((row.total - row.credit) * 100) / 100);
  const upcoming = isUpcoming(row, now);

  return {
    id: row.id,
    fieldName: localized(row.fieldName, lng),
    fieldHref: `/${lng}/fields/${row.fieldId}`,
    sport: sportLabel,
    date: formatDayChip(todayInAthens(row.startTime), lng).full,
    time: formatTimeRange(row.startTime, row.endTime, lng),
    status: row.status,
    phase: upcoming ? 'upcoming' : 'past',
    canCancel: upcoming && canCancelBooking(row.startTime, now),
    total: formatAmount(row.total, lng),
    card: card > 0 ? formatAmount(card, lng) : null,
    credit: row.credit > 0 ? formatAmount(row.credit, lng) : null,
    compensation: row.compensation,
  };
}
