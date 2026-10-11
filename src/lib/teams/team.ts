import type { SportType } from '@/lib/fields/types';
import { localized, type LocalizedText } from '@/lib/i18n-content';

export const TEAM_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
export type TeamLevel = (typeof TEAM_LEVELS)[number];

export const TEAM_NAME_MAX = 60;
export const TEAM_AREA_MAX = 120;
export const TEAM_DESCRIPTION_MAX = 600;
export const TEAM_POSITION_MAX = 60;
export const TEAM_MIN_MEMBERS = 2;
export const TEAM_MAX_MEMBERS = 30;
export const TEAM_DEFAULT_MEMBERS = 12;

export type TeamRoleValue = 'LEADER' | 'MEMBER';

export interface TeamListRow {
  id: string;
  name: string;
  area: LocalizedText;
  sportType: SportType;
  level: TeamLevel;
  logoUrl: string | null;
  isRecruiting: boolean;
  neededPosition: string | null;
  memberCount: number;
  maxMembers: number;
}

export interface TeamListItem extends Omit<TeamListRow, 'area'> {
  area: string;
  full: boolean;
  recruiting: boolean;
}

export interface TeamMemberRow {
  membershipId: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  role: TeamRoleValue;
  joinedAt: Date;
}

export interface TeamDetailRow extends TeamListRow {
  description: LocalizedText | null;
  createdAt: Date;
  members: TeamMemberRow[];
}

export interface TeamDetailItem extends Omit<
  TeamDetailRow,
  'area' | 'description'
> {
  area: string;
  description: string | null;
  full: boolean;
  recruiting: boolean;
}

export interface JoinRequestRow {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface JoinRequestItem {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

export type TeamViewerState =
  | { kind: 'guest' }
  | { kind: 'leader' }
  | { kind: 'member' }
  | { kind: 'pending'; requestId: string }
  | { kind: 'sportTaken' }
  | { kind: 'full' }
  | { kind: 'open' };

export type TeamActionResult =
  | { status: 'ok' }
  | { status: 'conflict' }
  | { status: 'error' };

export type LogoItem =
  | { kind: 'existing'; url: string }
  | { kind: 'new'; file: File };

export interface TeamFormValues {
  name: string;
  sportType: SportType;
  level: TeamLevel;
  area: string;
  description: string;
  maxMembers: number;
  isRecruiting: boolean;
  neededPosition: string;
  logo: LogoItem | null;
}

export type TeamFormErrorKey = 'name' | 'sportType' | 'area' | 'maxMembers';
export type TeamFormErrors = Partial<Record<TeamFormErrorKey, string>>;

export function isTeamFull(memberCount: number, maxMembers: number): boolean {
  return memberCount >= maxMembers;
}

export function toTeamListItem(row: TeamListRow, lng: string): TeamListItem {
  const full = isTeamFull(row.memberCount, row.maxMembers);
  return {
    ...row,
    area: localized(row.area, lng),
    full,
    recruiting: row.isRecruiting && !full,
  };
}

export function toTeamDetailItem(
  row: TeamDetailRow,
  lng: string,
): TeamDetailItem {
  const full = isTeamFull(row.memberCount, row.maxMembers);
  return {
    ...row,
    area: localized(row.area, lng),
    description: row.description ? localized(row.description, lng) : null,
    full,
    recruiting: row.isRecruiting && !full,
  };
}

export function toJoinRequestItem(row: JoinRequestRow): JoinRequestItem {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    avatarUrl: row.avatarUrl,
    createdAt: row.createdAt.toISOString(),
  };
}

export interface ViewerStateInput {
  userId: string | null;
  members: { userId: string; role: TeamRoleValue }[];
  maxMembers: number;
  pendingRequestId: string | null;
  viewerSports: SportType[];
  sportType: SportType;
}

export function resolveViewerState(input: ViewerStateInput): TeamViewerState {
  if (!input.userId) return { kind: 'guest' };

  const membership = input.members.find(
    (member) => member.userId === input.userId,
  );
  if (membership) {
    return { kind: membership.role === 'LEADER' ? 'leader' : 'member' };
  }
  if (input.pendingRequestId) {
    return { kind: 'pending', requestId: input.pendingRequestId };
  }
  if (input.viewerSports.includes(input.sportType)) {
    return { kind: 'sportTaken' };
  }
  if (isTeamFull(input.members.length, input.maxMembers)) {
    return { kind: 'full' };
  }
  return { kind: 'open' };
}

export function teamInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const letters =
    words.length === 1
      ? Array.from(words[0]).slice(0, 2)
      : words.slice(0, 2).map((word) => Array.from(word)[0]);
  return letters.join('').toLocaleUpperCase('el');
}

export function formatTeamSince(date: Date, lng: string): string {
  return new Intl.DateTimeFormat(lng, {
    timeZone: 'Europe/Athens',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
