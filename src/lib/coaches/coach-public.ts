import type { FieldAvailabilityDay } from '@/lib/fields/detail';
import { formatTimeRange } from '@/lib/fields/detail-format';
import type { SearchParams } from '@/lib/fields/filters';
import { formatPricePerHour } from '@/lib/fields/format';
import { SPORT_TYPES, type SportType } from '@/lib/fields/types';
import { localized, type LocalizedText } from '@/lib/i18n-content';
import { getInitials } from './coach';

export interface CoachFilters {
  q: string;
  sport: SportType | null;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseCoachFilters(params: SearchParams): CoachFilters {
  const sport = firstValue(params.sport);
  return {
    q: (firstValue(params.q) ?? '').trim().slice(0, 100),
    sport: SPORT_TYPES.find((value) => value === sport) ?? null,
  };
}

export function buildCoachesQuery(filters: CoachFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.sport) params.set('sport', filters.sport);
  return params.toString();
}

export function hasActiveCoachFilters(filters: CoachFilters): boolean {
  return Boolean(filters.q || filters.sport);
}

export interface CoachListRow {
  id: string;
  name: string;
  sportType: SportType;
  area: LocalizedText;
  bio: LocalizedText;
  hourlyRate: number;
  nextSlotAt: Date | null;
  pricePerHourFrom: number | null;
}

export interface CoachListItem extends Omit<CoachListRow, 'area' | 'bio'> {
  initials: string;
  area: string;
  bio: string;
}

export function toCoachListItem(row: CoachListRow, lng: string): CoachListItem {
  return {
    ...row,
    initials: getInitials(row.name),
    area: localized(row.area, lng),
    bio: localized(row.bio, lng),
  };
}

export interface CoachDetailSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  price: number;
}

export interface CoachDetailRow {
  id: string;
  name: string;
  sportType: SportType;
  area: LocalizedText;
  bio: LocalizedText;
  certifications: string | null;
  hourlyRate: number;
  pricePerHourFrom: number | null;
  days: FieldAvailabilityDay[];
  selectedDay: string | null;
  slots: CoachDetailSlot[];
  nextAvailableDay: string | null;
}

export interface CoachDetail extends Omit<CoachDetailRow, 'area' | 'bio'> {
  initials: string;
  area: string;
  bio: string;
}

export function toCoachDetail(row: CoachDetailRow, lng: string): CoachDetail {
  return {
    ...row,
    initials: getInitials(row.name),
    area: localized(row.area, lng),
    bio: localized(row.bio, lng),
  };
}

export const COACH_SLOT_STATUSES = [
  'OPEN',
  'PENDING_APPROVAL',
  'BOOKED',
] as const;
export type CoachSlotStatusValue = (typeof COACH_SLOT_STATUSES)[number];

export interface CoachSlotRow {
  id: string;
  startTime: Date;
  endTime: Date;
  price: number;
  status: CoachSlotStatusValue;
}

export interface CoachSlotItem {
  id: string;
  time: string;
  price: string;
  status: CoachSlotStatusValue;
}

export interface CreateCoachSlotInput {
  date: string;
  startTime: string;
  endTime: string;
  price: number;
}

export function toCoachSlotItem(row: CoachSlotRow, lng: string): CoachSlotItem {
  return {
    id: row.id,
    time: formatTimeRange(row.startTime, row.endTime, lng),
    price: formatPricePerHour(row.price, lng),
    status: row.status,
  };
}
