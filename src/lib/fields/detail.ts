import { localized, type LocalizedText } from '@/lib/i18n-content';
import { parseFieldFilters, type SearchParams } from '@/lib/fields/filters';
import type { SportType } from '@/lib/fields/types';

export const DAY_WINDOW = 14;
export const REVIEWS_PREVIEW = 5;

export interface FieldDetailSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  price: number;
  sportType: SportType;
}

export interface FieldDetailReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  reviewerName: string;
}

export interface FieldAvailabilityDay {
  day: string;
  available: boolean;
}

export interface FieldDetailRow {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  area: LocalizedText;
  address: string;
  latitude: number;
  longitude: number;
  indoor: boolean;
  sports: SportType[];
  images: string[];
  rating: { average: number; count: number } | null;
  pricePerHourFrom: number | null;
  businessName: string | null;
  days: FieldAvailabilityDay[];
  selectedDay: string | null;
  slots: FieldDetailSlot[];
  nextAvailableDay: string | null;
  reviews: FieldDetailReview[];
}

export interface FieldDetail extends Omit<
  FieldDetailRow,
  'name' | 'description' | 'area'
> {
  name: string;
  description: string;
  area: string;
}

export function toFieldDetail(row: FieldDetailRow, lng: string): FieldDetail {
  return {
    ...row,
    name: localized(row.name, lng),
    description: localized(row.description, lng),
    area: localized(row.area, lng),
  };
}

export function addDays(day: string, amount: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function dayWindow(from: string, count: number = DAY_WINDOW): string[] {
  return Array.from({ length: count }, (_, index) => addDays(from, index));
}

export function parseDetailDate(params: SearchParams): string | null {
  return parseFieldFilters({ date: params.date }).date;
}
