import { SPORT_TYPES, type SportType } from './types';

export const FIELD_SORTS = ['newest', 'price', 'rating'] as const;
export type FieldSort = (typeof FIELD_SORTS)[number];

export const FIELD_TYPES = ['indoor', 'outdoor'] as const;
export type FieldTypeFilter = (typeof FIELD_TYPES)[number];

export const DEFAULT_SORT: FieldSort = 'newest';

export interface FieldFilters {
  q: string;
  type: FieldTypeFilter | null;
  sport: SportType | null;
  date: string | null;
  sort: FieldSort;
}

export type SearchParams = Record<string, string | string[] | undefined>;

const TIME_ZONE = 'Europe/Athens';

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function pick<T extends string>(
  options: readonly T[],
  value: string | undefined,
): T | null {
  return options.find((option) => option === value) ?? null;
}

function isValidDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function todayInAthens(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function tomorrowInAthens(now: Date = new Date()): string {
  const date = new Date(`${todayInAthens(now)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function parseFieldFilters(params: SearchParams): FieldFilters {
  const date = firstValue(params.date);

  return {
    q: (firstValue(params.q) ?? '').trim().slice(0, 100),
    type: pick(FIELD_TYPES, firstValue(params.type)),
    sport: pick(SPORT_TYPES, firstValue(params.sport)),
    date: date && isValidDay(date) && date >= todayInAthens() ? date : null,
    sort: pick(FIELD_SORTS, firstValue(params.sort)) ?? DEFAULT_SORT,
  };
}

export function buildFieldsQuery(filters: FieldFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.type) params.set('type', filters.type);
  if (filters.sport) params.set('sport', filters.sport);
  if (filters.date) params.set('date', filters.date);
  if (filters.sort !== DEFAULT_SORT) params.set('sort', filters.sort);
  return params.toString();
}

export function hasActiveFilters(filters: FieldFilters): boolean {
  return Boolean(filters.q || filters.type || filters.sport || filters.date);
}
