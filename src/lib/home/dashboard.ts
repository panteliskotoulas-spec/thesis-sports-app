import type { SportType } from '@/lib/fields/types';
import type { LocalizedText } from '@/lib/i18n-content';
import type { TournamentStatus } from '@/lib/tournaments/tournament';

export const DASHBOARD_ACTIONS_LIMIT = 5;
export const DASHBOARD_TEAMS_LIMIT = 3;
export const DASHBOARD_JOIN_REQUESTS_LIMIT = 2;
export const DASHBOARD_SESSIONS_LIMIT = 2;
export const DASHBOARD_TOURNAMENTS_LIMIT = 3;

export type PendingSplitKind = 'RESERVATION' | 'SESSION';

export interface PendingSplitRow {
  kind: PendingSplitKind;
  id: string;
  teamId: string;
  teamName: string;
  title: LocalizedText;
  startTime: Date;
  endTime: Date;
  amount: number;
}

export type DashboardActionKind =
  | 'RESERVATION_SPLIT'
  | 'SESSION_SPLIT'
  | 'SESSION_PAYMENT';

export interface DashboardAction {
  key: string;
  kind: DashboardActionKind;
  title: string;
  context: string | null;
  when: string;
  amount: string;
  href: string;
}

export interface DashboardActions {
  items: DashboardAction[];
  total: number;
}

export interface DashboardBooking {
  id: string;
  fieldName: string;
  fieldHref: string;
  sport: string;
  date: string;
  time: string;
  teamName: string | null;
}

export interface DashboardBookings {
  next: DashboardBooking | null;
  upcomingCount: number;
}

export interface DashboardTeam {
  id: string;
  name: string;
  logoUrl: string | null;
  sport: string;
  role: 'LEADER' | 'MEMBER';
  memberCount: number;
  maxMembers: number;
  pendingRequests: number;
}

export interface MyJoinRequestRow {
  id: string;
  teamId: string;
  teamName: string;
  logoUrl: string | null;
  sportType: SportType;
  createdAt: Date;
}

export interface DashboardJoinRequest {
  id: string;
  teamId: string;
  name: string;
  logoUrl: string | null;
  sport: string;
}

export interface DashboardTeams {
  items: DashboardTeam[];
  total: number;
  joinRequests: DashboardJoinRequest[];
  joinRequestsTotal: number;
}

export interface DashboardSession {
  id: string;
  coachName: string;
  coachHref: string;
  sport: string;
  date: string;
  time: string;
  teamName: string | null;
}

export interface DashboardCoaching {
  upcoming: DashboardSession[];
  upcomingCount: number;
  requestedCount: number;
}

export type TournamentEntryState = 'PARTICIPATING' | 'PENDING';

export interface MyTournamentEntryRow {
  tournamentId: string;
  teamId: string;
  teamName: string;
  state: TournamentEntryState;
}

export interface DashboardTournamentEntry {
  teamId: string;
  teamName: string;
  state: TournamentEntryState;
}

export interface DashboardTournament {
  id: string;
  name: string;
  sport: string;
  status: TournamentStatus;
  dates: string;
  teamCount: number;
  maxTeams: number;
  entries: DashboardTournamentEntry[];
}

export interface DashboardStats {
  matches: number;
  tournaments: number;
}

export interface PlayerDashboardData {
  actions: DashboardActions | null;
  bookings: DashboardBookings | null;
  teams: DashboardTeams | null;
  coaching: DashboardCoaching | null;
  tournaments: DashboardTournament[] | null;
  stats: DashboardStats | null;
}
