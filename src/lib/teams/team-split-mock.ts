import type { TeamSplitSummary, TeamSplitViewer } from '@/lib/teams/team-split';

export interface MockTeamSplitPayment {
  fieldName: string;
  date: string;
  time: string;
  leaderName: string;
  share: number;
  balance: number;
}

export function getMockTeamSplit(viewer: TeamSplitViewer): TeamSplitSummary {
  if (viewer === 'leader') {
    return {
      viewer,
      total: 60,
      share: 12,
      leaderName: 'Δημήτρης Α.',
      myStatus: null,
      members: [
        { userId: 'm1', name: 'Μαρία Κ.', amount: 12, status: 'PAID' },
        { userId: 'm2', name: 'Νίκος Π.', amount: 12, status: 'PAID' },
        { userId: 'm3', name: 'Έλενα Δ.', amount: 12, status: 'PENDING' },
        { userId: 'm4', name: 'Γιώργος Σ.', amount: 12, status: 'PENDING' },
      ],
    };
  }

  return {
    viewer,
    total: 60,
    share: 12,
    leaderName: 'Δημήτρης Α.',
    myStatus: 'PENDING',
    members: [],
  };
}

export function getMockTeamSplitPayment(lng: string): MockTeamSplitPayment {
  return {
    fieldName: 'Γήπεδο Άλσος 5x5',
    date: lng === 'el' ? 'Πέμπτη 15 Οκτωβρίου' : 'Thursday, 15 October',
    time: '21:00 – 22:00',
    leaderName: 'Δημήτρης Α.',
    share: 12,
    balance: 5,
  };
}

export async function mockPayTeamSplit(): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  return true;
}
