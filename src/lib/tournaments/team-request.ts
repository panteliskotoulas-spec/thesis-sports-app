export type TeamRequestViewer =
  | { kind: 'hidden' }
  | { kind: 'open'; team: { id: string; name: string } }
  | { kind: 'full'; teamName: string }
  | { kind: 'pending'; requestId: string; teamName: string; createdAt: string }
  | { kind: 'rejected'; teamName: string };

export type VisibleTeamRequestViewer = Exclude<
  TeamRequestViewer,
  { kind: 'hidden' }
>;

export interface TeamRequestItem {
  id: string;
  teamId: string;
  teamName: string;
  teamLogoUrl: string | null;
  leaderName: string;
  memberCount: number;
  createdAt: string;
}

export interface AdminRequestRow {
  id: string;
  teamName: string;
  teamLogoUrl: string | null;
  metaText: string;
}

export const HIDDEN_TEAM_REQUEST_VIEWER: TeamRequestViewer = { kind: 'hidden' };

export const EMPTY_TEAM_REQUESTS: TeamRequestItem[] = [];
