import type { SportType } from '@/lib/fields/types';
import type { TeamFilters } from './team-filters';
import type {
  JoinRequestRow,
  TeamDetailRow,
  TeamListRow,
  TeamMemberRow,
  TeamViewerState,
} from './team';

export const MOCK_VIEWS = [
  'guest',
  'leader',
  'member',
  'pending',
  'sportTaken',
  'full',
  'open',
] as const;
export type MockView = (typeof MOCK_VIEWS)[number];

export const MOCK_TAKEN_SPORTS: SportType[] = ['BASKETBALL'];

export function parseMockView(value: string | string[] | undefined): MockView {
  const first = Array.isArray(value) ? value[0] : value;
  return MOCK_VIEWS.find((view) => view === first) ?? 'open';
}

export function mockViewerState(view: MockView): TeamViewerState {
  if (view === 'pending') return { kind: 'pending', requestId: 'request-0' };
  return { kind: view };
}

const MOCK_TEAMS: TeamListRow[] = [
  {
    id: 'team-1',
    name: 'Αετοί Πεύκης',
    area: { el: 'Πεύκη, Θεσσαλονίκη', en: 'Pefki, Thessaloniki' },
    sportType: 'FOOTBALL',
    level: 'INTERMEDIATE',
    logoUrl: null,
    isRecruiting: true,
    neededPosition: 'Τερματοφύλακας',
    memberCount: 9,
    maxMembers: 12,
  },
  {
    id: 'team-2',
    name: 'Σκύλλοι Καλαμαριάς',
    area: { el: 'Καλαμαριά, Θεσσαλονίκη', en: 'Kalamaria, Thessaloniki' },
    sportType: 'BASKETBALL',
    level: 'ADVANCED',
    logoUrl: null,
    isRecruiting: true,
    neededPosition: 'Σέντερ',
    memberCount: 7,
    maxMembers: 10,
  },
  {
    id: 'team-3',
    name: 'Βόλεϊ Νεάπολης',
    area: { el: 'Νεάπολη, Θεσσαλονίκη', en: 'Neapoli, Thessaloniki' },
    sportType: 'VOLLEYBALL',
    level: 'BEGINNER',
    logoUrl: null,
    isRecruiting: true,
    neededPosition: null,
    memberCount: 12,
    maxMembers: 12,
  },
  {
    id: 'team-4',
    name: 'Τένις Άνω Πόλης',
    area: { el: 'Άνω Πόλη, Θεσσαλονίκη', en: 'Ano Poli, Thessaloniki' },
    sportType: 'TENNIS',
    level: 'INTERMEDIATE',
    logoUrl: null,
    isRecruiting: true,
    neededPosition: 'Διπλά',
    memberCount: 4,
    maxMembers: 8,
  },
  {
    id: 'team-5',
    name: 'Λύκοι Τούμπας',
    area: { el: 'Τούμπα, Θεσσαλονίκη', en: 'Toumba, Thessaloniki' },
    sportType: 'FOOTBALL',
    level: 'ADVANCED',
    logoUrl: null,
    isRecruiting: false,
    neededPosition: null,
    memberCount: 14,
    maxMembers: 14,
  },
  {
    id: 'team-6',
    name: 'Παρασκευή 7x7',
    area: { el: 'Εύοσμος, Θεσσαλονίκη', en: 'Evosmos, Thessaloniki' },
    sportType: 'FOOTBALL',
    level: 'BEGINNER',
    logoUrl: null,
    isRecruiting: true,
    neededPosition: null,
    memberCount: 6,
    maxMembers: 14,
  },
];

const MOCK_MEMBER_NAMES = [
  'Γιώργος Παπαδόπουλος',
  'Μάριος Κωνσταντίνου',
  'Νίκος Αλεξίου',
  'Στέφανος Μιχαηλίδης',
  'Αντώνης Βλάχος',
  'Κώστας Δήμου',
  'Θοδωρής Ζαφείρης',
  'Πέτρος Ιωάννου',
  'Χρήστος Λάμπρου',
  'Βασίλης Νικολαΐδης',
  'Άλκης Σταύρου',
  'Μιχάλης Φωτίου',
  'Λάζαρος Κυριακίδης',
  'Δημήτρης Αναστασίου',
];

function buildMembers(count: number): TeamMemberRow[] {
  return Array.from(
    { length: count },
    (_, index): TeamMemberRow => ({
      membershipId: `membership-${index + 1}`,
      userId: `user-${index + 1}`,
      name: MOCK_MEMBER_NAMES[index % MOCK_MEMBER_NAMES.length],
      avatarUrl: null,
      role: index === 0 ? 'LEADER' : 'MEMBER',
      joinedAt: new Date(Date.UTC(2026, 9, 1 + index)),
    }),
  );
}

export function getMockTeams(filters: TeamFilters): TeamListRow[] {
  return MOCK_TEAMS.filter((team) => {
    if (filters.sport && team.sportType !== filters.sport) return false;
    if (filters.recruiting) {
      return team.isRecruiting && team.memberCount < team.maxMembers;
    }
    return true;
  });
}

export function getMockTeamDetail(id: string): TeamDetailRow | null {
  const team = MOCK_TEAMS.find((candidate) => candidate.id === id);
  if (!team) return null;

  return {
    ...team,
    description: {
      el: 'Παίζουμε τα βράδια της Τρίτης και της Πέμπτης. Θέλουμε παρέα που έρχεται στην ώρα της και παίζει για το κέφι.',
      en: 'We play on Tuesday and Thursday evenings. We are looking for people who show up on time and play for fun.',
    },
    createdAt: new Date(Date.UTC(2026, 9, 1)),
    members: buildMembers(team.memberCount),
  };
}

export function getMockJoinRequests(): JoinRequestRow[] {
  return [
    {
      id: 'request-1',
      userId: 'user-20',
      name: 'Ελένη Καρρά',
      avatarUrl: null,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'request-2',
      userId: 'user-21',
      name: 'Δημήτρης Ράπτης',
      avatarUrl: null,
      createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
    },
  ];
}
