import { localized, type LocalizedText } from '@/lib/i18n-content';
import type { FieldStatusValue } from '@/lib/fields/approval';
import type { SportType } from '@/lib/fields/types';

export interface OwnerFieldRow {
  id: string;
  name: LocalizedText;
  area: LocalizedText;
  indoor: boolean;
  sports: SportType[];
  status: FieldStatusValue;
  rejectionReason: LocalizedText | null;
  archivedAt: Date | null;
  imageUrl: string | null;
}

export interface OwnerFieldItem {
  id: string;
  name: string;
  area: string;
  indoor: boolean;
  sports: SportType[];
  status: FieldStatusValue;
  rejectionReason: string | null;
  archived: boolean;
  imageUrl: string | null;
}

export interface OwnerFieldEditRow {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  area: LocalizedText;
  address: string;
  latitude: number;
  longitude: number;
  indoor: boolean;
  sports: SportType[];
  status: FieldStatusValue;
  rejectionReason: LocalizedText | null;
  images: string[];
}

export type ArchiveOutcome =
  | { archived: true }
  | { archived: false; futureReservations: number };

export function toOwnerFieldItem(
  row: OwnerFieldRow,
  lng: string,
): OwnerFieldItem {
  return {
    id: row.id,
    name: localized(row.name, lng),
    area: localized(row.area, lng),
    indoor: row.indoor,
    sports: row.sports,
    status: row.status,
    rejectionReason: row.rejectionReason
      ? localized(row.rejectionReason, lng) || null
      : null,
    archived: row.archivedAt !== null,
    imageUrl: row.imageUrl,
  };
}
