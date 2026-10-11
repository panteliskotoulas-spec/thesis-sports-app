import type { SportType } from '@/lib/fields/types';

export interface TeamBookingOption {
  id: string;
  name: string;
  logoUrl: string | null;
  sportType: SportType;
  memberCount: number;
  maxMembers: number;
}

export interface TeamReservationItem {
  id: string;
  fieldName: string;
  fieldHref: string;
  date: string;
  time: string;
  bookedBy: string;
}
