import 'server-only';
import {
  EMPTY_TEAM_REQUESTS,
  HIDDEN_TEAM_REQUEST_VIEWER,
  type TeamRequestItem,
  type TeamRequestViewer,
} from './team-request';

export async function loadTeamRequestViewer(
  tournamentId: string,
): Promise<TeamRequestViewer> {
  void tournamentId;
  return HIDDEN_TEAM_REQUEST_VIEWER;
}

export async function loadTournamentRequests(
  tournamentId: string,
): Promise<TeamRequestItem[]> {
  void tournamentId;
  return EMPTY_TEAM_REQUESTS;
}
