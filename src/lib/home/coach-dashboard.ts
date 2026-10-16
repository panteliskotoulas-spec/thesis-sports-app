import type { CoachStatusValue } from '@/lib/coaches/coach';

export const COACH_REQUESTS_LIMIT = 3;

export interface CoachDashboardEntry {
  id: string;
  requesterName: string;
  teamName: string | null;
  when: string;
}

export interface CoachDashboardRequests {
  items: CoachDashboardEntry[];
  total: number;
}

export interface CoachDashboardSessions {
  items: CoachDashboardEntry[];
  total: number;
  awaitingPayment: number;
}

export interface CoachDashboardData {
  status: CoachStatusValue;
  rejectionReason: string | null;
  requests: CoachDashboardRequests | null;
  sessions: CoachDashboardSessions | null;
  openSlots: number | null;
}
