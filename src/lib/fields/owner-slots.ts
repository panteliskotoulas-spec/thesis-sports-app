import { formatTimeRange } from '@/lib/fields/detail-format';
import { formatPricePerHour } from '@/lib/fields/format';
import type { SportType } from '@/lib/fields/types';

export const SLOT_STATUSES = ['OPEN', 'PENDING_PAYMENT', 'BOOKED'] as const;
export type SlotStatusValue = (typeof SLOT_STATUSES)[number];

export interface OwnerSlotRow {
  id: string;
  startTime: Date;
  endTime: Date;
  price: number;
  sportType: SportType;
  status: SlotStatusValue;
}

export interface OwnerSlotItem {
  id: string;
  time: string;
  sport: string;
  price: string;
  status: SlotStatusValue;
}

export interface CreateSlotInput {
  fieldId: string;
  date: string;
  startTime: string;
  endTime: string;
  sportType: SportType;
  price: number;
}

export type CreateSlotResult =
  | { status: 'ok' }
  | { status: 'overlap' }
  | { status: 'invalid' }
  | { status: 'error' };

export type DeleteSlotResult =
  | { status: 'ok' }
  | { status: 'conflict' }
  | { status: 'error' };

export type SlotDraftError =
  | 'date'
  | 'start'
  | 'end'
  | 'order'
  | 'past'
  | 'sport'
  | 'price';

export interface SlotDraft {
  date: string;
  startTime: string;
  endTime: string;
  sportType: SportType | null;
  price: string;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PRICE_PATTERN = /^\d{1,4}([.,]\d{1,2})?$/;
const MAX_PRICE = 9999.99;

export function toMinutes(value: string): number | null {
  const match = TIME_PATTERN.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function parsePrice(value: string): number | null {
  const trimmed = value.trim();
  if (!PRICE_PATTERN.test(trimmed)) return null;
  const parsed = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > MAX_PRICE) {
    return null;
  }
  return Math.round(parsed * 100) / 100;
}

export function currentAthensMinutes(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Athens',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(
    parts.find((part) => part.type === 'minute')?.value ?? 0,
  );
  return hour * 60 + minute;
}

export function validateSlotDraft(
  draft: SlotDraft,
  today: string,
  nowMinutes: number,
): SlotDraftError | null {
  if (!DAY_PATTERN.test(draft.date) || draft.date < today) return 'date';

  const start = toMinutes(draft.startTime);
  if (start === null) return 'start';

  const end = toMinutes(draft.endTime);
  if (end === null) return 'end';

  if (end <= start) return 'order';
  if (draft.date === today && start <= nowMinutes) return 'past';
  if (draft.sportType === null) return 'sport';
  if (parsePrice(draft.price) === null) return 'price';

  return null;
}

export function toOwnerSlotItem(
  row: OwnerSlotRow,
  lng: string,
  sportLabel: string,
): OwnerSlotItem {
  return {
    id: row.id,
    time: formatTimeRange(row.startTime, row.endTime, lng),
    sport: sportLabel,
    price: formatPricePerHour(row.price, lng),
    status: row.status,
  };
}
