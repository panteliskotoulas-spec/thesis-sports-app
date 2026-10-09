import { localized, type LocalizedText } from '@/lib/i18n-content';

// Αντικατοπτρίζει το enum SportType του Prisma.
export const SPORT_TYPES = [
  'FOOTBALL',
  'BASKETBALL',
  'VOLLEYBALL',
  'TENNIS',
] as const;
export type SportType = (typeof SPORT_TYPES)[number];

export interface FieldListRow {
  id: string;
  name: LocalizedText;
  area: LocalizedText;
  indoor: boolean;
  sports: SportType[];
  imageUrl: string | null;
  rating: { average: number; count: number } | null;
  nextSlotAt: Date | null;
  pricePerHourFrom: number | null;
}

// Ό,τι χρειάζεται η κάρτα: τα κείμενα είναι ήδη στη γλώσσα της σελίδας.
export interface FieldListItem extends Omit<FieldListRow, 'name' | 'area'> {
  name: string;
  area: string;
}

export function toFieldListItem(row: FieldListRow, lng: string): FieldListItem {
  return {
    ...row,
    name: localized(row.name, lng),
    area: localized(row.area, lng),
  };
}
