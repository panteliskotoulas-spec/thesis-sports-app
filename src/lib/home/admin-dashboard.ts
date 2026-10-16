export const ADMIN_PENDING_TOURNAMENTS_LIMIT = 3;
export const ADMIN_ONGOING_LIMIT = 3;

export interface AdminPendingTournamentRow {
  id: string;
  name: string;
  count: number;
}

export interface AdminPendingRow {
  fields: number;
  coaches: number;
  tournamentRequests: number;
  tournaments: AdminPendingTournamentRow[];
}

export interface AdminDashboardPending {
  fields: number;
  coaches: number;
  tournamentRequests: number;
  total: number;
  tournaments: AdminPendingTournamentRow[];
  hiddenTournaments: number;
}

export interface AdminDashboardOngoingItem {
  id: string;
  name: string;
  sport: string;
  dates: string;
  teamCount: number;
  maxTeams: number;
}

export interface AdminDashboardOngoing {
  items: AdminDashboardOngoingItem[];
  total: number;
}

export interface AdminDashboardData {
  pending: AdminDashboardPending | null;
  ongoing: AdminDashboardOngoing | null;
}
