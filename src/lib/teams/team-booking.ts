import { formatDayChip, formatTimeRange } from '@/lib/fields/detail-format';
import { todayInAthens } from '@/lib/fields/filters';
import type { SportType } from '@/lib/fields/types';
import { localized, type LocalizedText } from '@/lib/i18n-content';
import type { TeamSplitSummary } from '@/lib/teams/team-split';

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
  split: TeamSplitSummary | null;
}

export interface TeamReservationRow {
  id: string;
  fieldId: string;
  fieldName: LocalizedText;
  startTime: Date;
  endTime: Date;
  bookedBy: string;
  split: TeamSplitSummary | null;
}

export function toTeamReservationItem(
  row: TeamReservationRow,
  lng: string,
): TeamReservationItem {
  return {
    id: row.id,
    fieldName: localized(row.fieldName, lng),
    fieldHref: `/${lng}/fields/${row.fieldId}`,
    date: formatDayChip(todayInAthens(row.startTime), lng).full,
    time: formatTimeRange(row.startTime, row.endTime, lng),
    bookedBy: row.bookedBy,
    split: row.split,
  };
}
