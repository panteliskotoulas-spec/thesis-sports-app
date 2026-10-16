import type { LocalizedText } from '@/lib/i18n-content';

export const OWNER_BOOKINGS_LIMIT = 3;
export const OWNER_NO_SLOTS_LIMIT = 3;

export interface OwnerFieldWithoutSlotsRow {
  id: string;
  name: LocalizedText;
}

export interface OwnerDashboardFields {
  approved: number;
  pending: number;
  rejected: number;
  total: number;
}

export interface OwnerDashboardBooking {
  id: string;
  fieldName: string;
  playerName: string;
  sport: string;
  when: string;
}

export interface OwnerDashboardBookings {
  items: OwnerDashboardBooking[];
  total: number;
}

export interface OwnerDashboardNoSlotsItem {
  id: string;
  name: string;
}

export interface OwnerDashboardNoSlots {
  items: OwnerDashboardNoSlotsItem[];
  total: number;
}

export interface OwnerDashboardData {
  fields: OwnerDashboardFields | null;
  bookings: OwnerDashboardBookings | null;
  withoutSlots: OwnerDashboardNoSlots | null;
}
