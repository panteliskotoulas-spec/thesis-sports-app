import type { SportType } from '@/lib/fields/types';
import { localized, type LocalizedText } from '@/lib/i18n-content';

export const COACH_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type CoachStatusValue = (typeof COACH_STATUSES)[number];

export const DEFAULT_COACH_STATUS: CoachStatusValue = 'PENDING';

export const COACH_BIO_MAX = 1000;
export const COACH_CERTIFICATIONS_MAX = 300;
export const COACH_RATE_MIN = 1;
export const COACH_RATE_MAX = 500;
export const COACH_REJECTION_REASON_MAX = 500;

export type CoachActionResult = 'ok' | 'conflict' | 'error';

export interface CoachFormValues {
  sportType: SportType;
  bio: string;
  hourlyRate: number;
  certifications: string;
}

export interface CoachFormInitial {
  sportType: SportType;
  bio: string;
  hourlyRate: string;
  certifications: string;
}

export type CoachFormErrorKey = 'sportType' | 'bio' | 'hourlyRate';
export type CoachFormErrors = Partial<Record<CoachFormErrorKey, string>>;

export interface CoachApprovalRow {
  id: string;
  name: string;
  email: string;
  sportType: SportType;
  bio: string;
  certifications: string | null;
  hourlyRate: number;
  status: CoachStatusValue;
  rejectionReason: string | null;
  createdAt: Date;
}

export interface CoachApprovalRecord {
  id: string;
  name: string;
  email: string;
  sportType: SportType;
  bio: LocalizedText;
  certifications: string | null;
  hourlyRate: number;
  status: CoachStatusValue;
  rejectionReason: LocalizedText | null;
  createdAt: Date;
}

export interface CoachApprovalRecordList {
  coaches: CoachApprovalRecord[];
  counts: Record<CoachStatusValue, number>;
}

export interface CoachMineRecord {
  status: CoachStatusValue;
  rejectionReason: LocalizedText | null;
  sportType: SportType;
  bio: LocalizedText;
  hourlyRate: number;
  certifications: string | null;
}

export interface CoachApprovalCardData {
  id: string;
  name: string;
  initials: string;
  email: string;
  sport: { value: SportType; label: string };
  rate: string;
  bio: string;
  certifications: string | null;
  submitted: string;
  status: CoachStatusValue;
  rejectionReason: string | null;
}

export function parseCoachStatus(
  value: string | string[] | undefined,
): CoachStatusValue {
  const candidate = Array.isArray(value) ? value[0] : value;
  return (
    COACH_STATUSES.find((status) => status === candidate) ??
    DEFAULT_COACH_STATUS
  );
}

export function parseHourlyRate(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const rate = Number(normalized);
  return rate >= COACH_RATE_MIN && rate <= COACH_RATE_MAX ? rate : null;
}

export function formatRate(rate: number, lng: string): string {
  return new Intl.NumberFormat(lng, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: Number.isInteger(rate) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rate);
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function toCoachApprovalRow(
  record: CoachApprovalRecord,
  lng: string,
): CoachApprovalRow {
  return {
    ...record,
    bio: localized(record.bio, lng),
    rejectionReason: record.rejectionReason
      ? localized(record.rejectionReason, lng)
      : null,
  };
}
