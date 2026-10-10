import { localized, type LocalizedText } from '@/lib/i18n-content';
import type { SportType } from '@/lib/fields/types';

export const FIELD_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type FieldStatusValue = (typeof FIELD_STATUSES)[number];

export const DEFAULT_FIELD_STATUS: FieldStatusValue = 'PENDING';
export const REJECTION_REASON_MAX = 500;

export interface FieldApprovalRow {
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
  createdAt: Date;
  images: string[];
  owner: { name: string; business: boolean; businessName: string | null };
}

export interface FieldApprovalList {
  fields: FieldApprovalRow[];
  counts: Record<FieldStatusValue, number>;
}

export interface FieldApprovalItem extends Omit<
  FieldApprovalRow,
  'name' | 'description' | 'area' | 'rejectionReason'
> {
  name: string;
  description: string;
  area: string;
  rejectionReason: string | null;
}

export function parseFieldStatus(
  value: string | string[] | undefined,
): FieldStatusValue {
  const candidate = Array.isArray(value) ? value[0] : value;
  return (
    FIELD_STATUSES.find((status) => status === candidate) ??
    DEFAULT_FIELD_STATUS
  );
}

export function toFieldApprovalItem(
  row: FieldApprovalRow,
  lng: string,
): FieldApprovalItem {
  return {
    ...row,
    name: localized(row.name, lng),
    description: localized(row.description, lng),
    area: localized(row.area, lng),
    rejectionReason: row.rejectionReason
      ? localized(row.rejectionReason, lng)
      : null,
  };
}
