import {
  COACH_STATUSES,
  type CoachApprovalList,
  type CoachApprovalResult,
  type CoachApprovalRow,
  type CoachFormInitial,
  type CoachFormValues,
  type CoachStatusValue,
} from '@/lib/coaches/coach';

export const MOCK_COACH_STATES = [
  'NONE',
  'PENDING',
  'APPROVED',
  'REJECTED',
] as const;
export type MockCoachState = (typeof MOCK_COACH_STATES)[number];

export function parseMockCoachState(
  value: string | string[] | undefined,
): MockCoachState {
  const candidate = Array.isArray(value) ? value[0] : value;
  return MOCK_COACH_STATES.find((state) => state === candidate) ?? 'NONE';
}

export interface MockCoachApplication {
  status: CoachStatusValue | null;
  rejectionReason: string | null;
  initial: CoachFormInitial | undefined;
}

const MOCK_INITIAL: CoachFormInitial = {
  sportType: 'TENNIS',
  bio: 'Προπονητής τένις με 8 χρόνια εμπειρία σε παιδιά και ενήλικες. Δουλεύω στην τεχνική και στην προετοιμασία για αγώνες.',
  hourlyRate: '25',
  certifications: 'Δίπλωμα προπονητή τένις, επίπεδο Β',
};

export function getMockCoachApplication(
  state: MockCoachState,
): MockCoachApplication {
  if (state === 'NONE') {
    return { status: null, rejectionReason: null, initial: undefined };
  }
  return {
    status: state,
    rejectionReason:
      state === 'REJECTED'
        ? 'Πρόσθεσε περισσότερες λεπτομέρειες για την εμπειρία σου και τις πιστοποιήσεις σου.'
        : null,
    initial: MOCK_INITIAL,
  };
}

const MOCK_ROWS: CoachApprovalRow[] = [
  {
    id: 'coach-1',
    name: 'Νίκος Παπαδόπουλος',
    email: 'nikos.papadopoulos@example.com',
    sportType: 'TENNIS',
    bio: 'Προπονητής τένις με 8 χρόνια εμπειρία σε παιδιά και ενήλικες. Δουλεύω στην τεχνική και στην προετοιμασία για αγώνες.',
    certifications: 'Δίπλωμα προπονητή τένις, επίπεδο Β',
    hourlyRate: 25,
    status: 'PENDING',
    rejectionReason: null,
    createdAt: new Date('2026-10-09T10:20:00Z'),
  },
  {
    id: 'coach-2',
    name: 'Μαρία Κωνσταντίνου',
    email: 'maria.k@example.com',
    sportType: 'BASKETBALL',
    bio: 'Πρώην παίκτρια της Α1 γυναικών. Κάνω ατομικά μαθήματα σουτ και ντρίμπλας.',
    certifications: null,
    hourlyRate: 40,
    status: 'PENDING',
    rejectionReason: null,
    createdAt: new Date('2026-10-10T08:05:00Z'),
  },
  {
    id: 'coach-3',
    name: 'Γιώργος Αλεξίου',
    email: 'g.alexiou@example.com',
    sportType: 'FOOTBALL',
    bio: 'Προπονητής ακαδημιών ποδοσφαίρου. Εξειδίκευση στις μικρές ηλικίες.',
    certifications: 'UEFA C',
    hourlyRate: 30.5,
    status: 'APPROVED',
    rejectionReason: null,
    createdAt: new Date('2026-10-02T14:40:00Z'),
  },
  {
    id: 'coach-4',
    name: 'Ελένη Δημητρίου',
    email: 'eleni.d@example.com',
    sportType: 'VOLLEYBALL',
    bio: 'Παίζω βόλεϊ.',
    certifications: null,
    hourlyRate: 15,
    status: 'REJECTED',
    rejectionReason:
      'Η περιγραφή είναι πολύ σύντομη. Πρόσθεσε εμπειρία και πιστοποιήσεις.',
    createdAt: new Date('2026-10-01T09:15:00Z'),
  },
];

export function getMockCoachApprovalList(
  status: CoachStatusValue,
): CoachApprovalList {
  const counts = Object.fromEntries(
    COACH_STATUSES.map((value) => [
      value,
      MOCK_ROWS.filter((row) => row.status === value).length,
    ]),
  ) as Record<CoachStatusValue, number>;

  return {
    coaches: MOCK_ROWS.filter((row) => row.status === status),
    counts,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockSubmitCoachApplication(
  values: CoachFormValues,
): Promise<void> {
  void values;
  await delay(600);
}

export async function mockApproveCoach(
  id: string,
): Promise<CoachApprovalResult> {
  void id;
  await delay(500);
  return 'ok';
}

export async function mockRejectCoach(
  id: string,
  reason: string,
): Promise<CoachApprovalResult> {
  void id;
  void reason;
  await delay(500);
  return 'ok';
}
