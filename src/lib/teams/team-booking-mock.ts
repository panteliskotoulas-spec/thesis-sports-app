import { formatDayChip, formatTimeRange } from '@/lib/fields/detail-format';
import { todayInAthens } from '@/lib/fields/filters';
import type { SportType } from '@/lib/fields/types';
import type {
  TeamBookingOption,
  TeamReservationItem,
} from '@/lib/teams/team-booking';

const MOCK_TEAM_NAME = 'Αετοί Πεύκων';

export function getMockTeamBookingOptions(
  sportType: SportType,
): TeamBookingOption[] {
  return [
    {
      id: 'mock-team-1',
      name: MOCK_TEAM_NAME,
      logoUrl: null,
      sportType,
      memberCount: 8,
      maxMembers: 12,
    },
  ];
}

function atHour(daysAhead: number, hour: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hour, 0, 0, 0);
  return date;
}

export function getMockTeamReservations(lng: string): TeamReservationItem[] {
  const slots = [
    { id: 'mock-res-1', field: 'Γήπεδο 5x5 Πεύκων', daysAhead: 6, hour: 20 },
    {
      id: 'mock-res-2',
      field: 'Αθλητικό Κέντρο Βύρωνα',
      daysAhead: 13,
      hour: 19,
    },
  ];

  return slots.map((slot) => {
    const start = atHour(slot.daysAhead, slot.hour);
    const end = atHour(slot.daysAhead, slot.hour + 1);

    return {
      id: slot.id,
      fieldName: slot.field,
      fieldHref: `/${lng}/fields`,
      date: formatDayChip(todayInAthens(start), lng).full,
      time: formatTimeRange(start, end, lng),
      bookedBy: 'Νίκος',
    };
  });
}

export function withMockTeamName<T extends { teamName?: string | null }>(
  rows: T[],
): T[] {
  return rows.map((row, index) =>
    index === 0 ? { ...row, teamName: MOCK_TEAM_NAME } : row,
  );
}
