import type { LocalizedText } from '@/lib/i18n-content';

export type TeamSplitStatus = 'PENDING' | 'PAID';

export type TeamSplitViewer = 'leader' | 'member';

export interface TeamSplitMember {
  userId: string;
  name: string;
  amount: number;
  status: TeamSplitStatus;
}

export interface TeamSplitSummary {
  viewer: TeamSplitViewer;
  total: number;
  share: number;
  leaderName: string;
  members: TeamSplitMember[];
  myStatus: TeamSplitStatus | null;
}

export interface SplitProgressValues {
  paidCount: number;
  collected: number;
  owed: number;
  percent: number;
}

export function computeSplitProgress(
  members: TeamSplitMember[],
): SplitProgressValues {
  const paid = members.filter((member) => member.status === 'PAID');
  const collected = paid.reduce((sum, member) => sum + member.amount, 0);
  const owed = members.reduce((sum, member) => sum + member.amount, 0);
  const percent = owed > 0 ? Math.round((collected / owed) * 100) : 0;

  return { paidCount: paid.length, collected, owed, percent };
}

export function splitPayHref(
  lng: string,
  teamId: string,
  reservationId: string,
): string {
  return `/${lng}/teams/${teamId}/split/${reservationId}`;
}

export function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part.charAt(0));
  return letters.join('').toUpperCase();
}

export interface TeamSplitPayRow {
  splitId: string;
  fieldId: string;
  fieldName: LocalizedText;
  startTime: Date;
  endTime: Date;
  leaderName: string;
  share: number;
  balance: number;
}
