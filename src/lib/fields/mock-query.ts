import { todayInAthens, type FieldFilters, type FieldSort } from './filters';
import { getMockFields } from './mock';
import type { FieldListRow } from './types';

const OPEN_DAYS: Record<string, number[]> = {
  'mock-1': [0, 1, 2, 3, 4],
  'mock-2': [1, 2, 4, 5],
  'mock-3': [0, 1, 3],
  'mock-4': [2, 3, 5, 6],
  'mock-5': [1, 2, 3],
  'mock-6': [0, 2, 4],
  'mock-7': [3, 4, 5],
  'mock-8': [],
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function matchesQuery(row: FieldListRow, query: string): boolean {
  const haystack = [row.name.el, row.name.en, row.area.el, row.area.en]
    .map(normalize)
    .join(' ');
  return haystack.includes(normalize(query));
}

function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000,
  );
}

function withDay(source: Date, day: string): Date {
  const [year, month, dayOfMonth] = day.split('-').map(Number);
  const date = new Date(source);
  date.setFullYear(year, month - 1, dayOfMonth);
  return date;
}

function compareAvailability(a: FieldListRow, b: FieldListRow): number {
  return Number(a.nextSlotAt === null) - Number(b.nextSlotAt === null);
}

function compareBySort(
  a: FieldListRow,
  b: FieldListRow,
  sort: FieldSort,
): number {
  if (sort === 'price') {
    return (
      (a.pricePerHourFrom ?? Number.MAX_SAFE_INTEGER) -
      (b.pricePerHourFrom ?? Number.MAX_SAFE_INTEGER)
    );
  }
  if (sort === 'rating') {
    return (b.rating?.average ?? -1) - (a.rating?.average ?? -1);
  }
  return 0;
}

export function queryMockFields(filters: FieldFilters): FieldListRow[] {
  const dayOffset = filters.date
    ? daysBetween(todayInAthens(), filters.date)
    : null;

  return getMockFields()
    .filter((row) => !filters.q || matchesQuery(row, filters.q))
    .filter(
      (row) =>
        filters.type === null || row.indoor === (filters.type === 'indoor'),
    )
    .filter(
      (row) => filters.sport === null || row.sports.includes(filters.sport),
    )
    .filter(
      (row) => dayOffset === null || OPEN_DAYS[row.id]?.includes(dayOffset),
    )
    .map((row) =>
      filters.date && row.nextSlotAt
        ? { ...row, nextSlotAt: withDay(row.nextSlotAt, filters.date) }
        : row,
    )
    .sort(
      (a, b) => compareAvailability(a, b) || compareBySort(a, b, filters.sort),
    );
}
