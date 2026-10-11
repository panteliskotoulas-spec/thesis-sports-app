import { addDays, dayWindow } from '@/lib/fields/detail';
import { todayInAthens } from '@/lib/fields/filters';
import type { SportType } from '@/lib/fields/types';
import type { LocalizedText } from '@/lib/i18n-content';
import type {
  CoachDetailRow,
  CoachFilters,
  CoachListRow,
  CoachSlotRow,
  CoachSlotStatusValue,
} from './coach-public';

type SlotPlan = [
  dayOffset: number,
  start: string,
  end: string,
  price: number,
  status: CoachSlotStatusValue,
];

interface MockCoach {
  id: string;
  name: string;
  sportType: SportType;
  area: LocalizedText;
  bio: LocalizedText;
  certifications: string | null;
  hourlyRate: number;
  plan: SlotPlan[];
}

const MOCK_COACHES: MockCoach[] = [
  {
    id: 'mock-1',
    name: 'Νίκος Παπαδόπουλος',
    sportType: 'FOOTBALL',
    area: { el: 'Γλυφάδα, Αθήνα', en: 'Glyfada, Athens' },
    bio: {
      el: 'Προπονητής UEFA B με 10 χρόνια εμπειρία σε ακαδημίες. Εστίαση στην τεχνική και στο παιχνίδι χωρίς μπάλα. Δουλεύω με ατομικές προπονήσεις και με ομάδες.',
      en: 'UEFA B coach with 10 years of academy experience. I focus on technique and off-the-ball play. I work with individual sessions and with teams.',
    },
    certifications: 'UEFA B License, Πτυχίο ΤΕΦΑΑ',
    hourlyRate: 25,
    plan: [
      [1, '18:00', '19:00', 25, 'OPEN'],
      [1, '19:00', '20:30', 38, 'OPEN'],
      [1, '20:30', '21:30', 25, 'PENDING_APPROVAL'],
      [2, '10:00', '11:00', 25, 'BOOKED'],
      [2, '17:00', '18:00', 25, 'OPEN'],
      [4, '09:00', '10:30', 36, 'OPEN'],
      [4, '11:00', '12:00', 25, 'OPEN'],
      [7, '19:30', '20:30', 25, 'OPEN'],
    ],
  },
  {
    id: 'mock-2',
    name: 'Μαρία Κωνσταντίνου',
    sportType: 'TENNIS',
    area: { el: 'Καλαμαριά, Θεσσαλονίκη', en: 'Kalamaria, Thessaloniki' },
    bio: {
      el: 'Πρώην αθλήτρια πρωταθλήματος, διπλωματούχος προπονήτρια. Μαθήματα για αρχάριους και προχωρημένους, ατομικά ή σε μικρές ομάδες.',
      en: 'Former league player and certified coach. Lessons for beginners and advanced players, one-on-one or in small groups.',
    },
    certifications: 'Δίπλωμα προπονητή τένις, επίπεδο Β',
    hourlyRate: 30,
    plan: [
      [2, '10:00', '11:00', 30, 'OPEN'],
      [2, '11:00', '12:30', 45, 'OPEN'],
      [3, '17:00', '18:00', 30, 'OPEN'],
      [5, '09:00', '10:00', 30, 'OPEN'],
    ],
  },
  {
    id: 'mock-3',
    name: 'Γιώργος Αντωνίου',
    sportType: 'BASKETBALL',
    area: { el: 'Γλυφάδα, Αθήνα', en: 'Glyfada, Athens' },
    bio: {
      el: 'Ατομική προπόνηση σουτ και ball handling για νέους αθλητές και ομάδες.',
      en: 'Individual shooting and ball handling training for young players and teams.',
    },
    certifications: null,
    hourlyRate: 20,
    plan: [
      [3, '19:30', '20:30', 20, 'OPEN'],
      [3, '20:30', '21:30', 20, 'OPEN'],
      [6, '18:00', '19:30', 30, 'OPEN'],
    ],
  },
  {
    id: 'mock-4',
    name: 'Ελένη Μαυρίδου',
    sportType: 'VOLLEYBALL',
    area: { el: 'Πειραιάς', en: 'Piraeus' },
    bio: {
      el: "Προπονήτρια βόλεϊ με εμπειρία σε σύλλογο Α' κατηγορίας. Υποδοχή, πάσα και επίθεση.",
      en: 'Volleyball coach with experience at a top-division club. Passing, setting and attacking.',
    },
    certifications: null,
    hourlyRate: 22,
    plan: [],
  },
];

const MY_COACH_ID = 'mock-1';

function athensDate(day: string, time: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  for (const offset of [3, 2]) {
    const candidate = new Date(
      Date.UTC(year, month - 1, date, hour - offset, minute),
    );
    const shown = Number(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Athens',
        hour: '2-digit',
        hourCycle: 'h23',
      }).format(candidate),
    );
    if (shown === hour) return candidate;
  }
  return new Date(`${day}T${time}:00Z`);
}

function buildSlots(coach: MockCoach): CoachSlotRow[] {
  const today = todayInAthens();
  return coach.plan.map(([offset, start, end, price, status], index) => {
    const day = addDays(today, offset);
    return {
      id: `${coach.id}-slot-${index}`,
      startTime: athensDate(day, start),
      endTime: athensDate(day, end),
      price,
      status,
    };
  });
}

function perHour(slot: CoachSlotRow): number {
  const hours = (slot.endTime.getTime() - slot.startTime.getTime()) / 3600000;
  return Math.round((slot.price / hours) * 100) / 100;
}

function openSlots(coach: MockCoach): CoachSlotRow[] {
  const now = new Date();
  return buildSlots(coach)
    .filter((slot) => slot.status === 'OPEN' && slot.startTime > now)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

function matches(coach: MockCoach, query: string): boolean {
  const haystack = [coach.name, coach.area.el, coach.area.en]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function mockListCoaches(filters: CoachFilters): CoachListRow[] {
  return MOCK_COACHES.filter(
    (coach) => !filters.sport || coach.sportType === filters.sport,
  )
    .filter((coach) => !filters.q || matches(coach, filters.q))
    .map((coach) => {
      const slots = openSlots(coach);
      return {
        id: coach.id,
        name: coach.name,
        sportType: coach.sportType,
        area: coach.area,
        bio: coach.bio,
        hourlyRate: coach.hourlyRate,
        nextSlotAt: slots[0]?.startTime ?? null,
        pricePerHourFrom: slots.length ? Math.min(...slots.map(perHour)) : null,
      };
    })
    .sort(
      (a, b) =>
        Number(b.nextSlotAt !== null) - Number(a.nextSlotAt !== null) ||
        a.name.localeCompare(b.name, 'el'),
    );
}

export function mockGetCoach(
  id: string,
  date: string | null,
): CoachDetailRow | null {
  const coach = MOCK_COACHES.find((entry) => entry.id === id);
  if (!coach) return null;

  const today = todayInAthens();
  const slots = openSlots(coach).map((slot) => ({
    ...slot,
    day: todayInAthens(slot.startTime),
  }));
  const availableDays = new Set(slots.map((slot) => slot.day));
  const days = dayWindow(today).map((day) => ({
    day,
    available: availableDays.has(day),
  }));

  const requestedDay = date && date >= today ? date : null;
  const selectedDay =
    requestedDay ?? days.find((entry) => entry.available)?.day ?? null;
  const selectedSlots = selectedDay
    ? slots.filter((slot) => slot.day === selectedDay)
    : [];
  const nextAvailableDay =
    selectedDay && selectedSlots.length === 0
      ? (Array.from(availableDays)
          .sort()
          .find((day) => day > selectedDay) ?? null)
      : null;

  return {
    id: coach.id,
    name: coach.name,
    sportType: coach.sportType,
    area: coach.area,
    bio: coach.bio,
    certifications: coach.certifications,
    hourlyRate: coach.hourlyRate,
    pricePerHourFrom: slots.length ? Math.min(...slots.map(perHour)) : null,
    days,
    selectedDay,
    slots: selectedSlots.map((slot) => ({
      id: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      price: slot.price,
    })),
    nextAvailableDay,
  };
}

export function mockMySlots(day: string): CoachSlotRow[] {
  const coach = MOCK_COACHES.find((entry) => entry.id === MY_COACH_ID);
  if (!coach) return [];
  return buildSlots(coach)
    .filter((slot) => todayInAthens(slot.startTime) === day)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}
