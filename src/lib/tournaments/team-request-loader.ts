import 'server-only';
import { getServerCaller } from '@/trpc/server/caller';
import {
  EMPTY_TEAM_REQUESTS,
  HIDDEN_TEAM_REQUEST_VIEWER,
  type TeamRequestItem,
  type TeamRequestViewer,
} from './team-request';

export async function loadTeamRequestViewer(
  tournamentId: string,
): Promise<TeamRequestViewer> {
  try {
    const caller = await getServerCaller();
    return await caller.tournamentRequests.viewer({ tournamentId });
  } catch (error) {
    console.error('[loadTeamRequestViewer]', error);
    return HIDDEN_TEAM_REQUEST_VIEWER;
  }
}

export async function loadRejectedTournamentRequests(
  tournamentId: string,
): Promise<TeamRequestItem[]> {
  try {
    const caller = await getServerCaller();
    return await caller.tournamentRequests.listRejected({ tournamentId });
  } catch (error) {
    console.error('[loadRejectedTournamentRequests]', error);
    return EMPTY_TEAM_REQUESTS;
  }
}

export async function loadTournamentRequests(
  tournamentId: string,
): Promise<TeamRequestItem[]> {
  try {
    const caller = await getServerCaller();
    return await caller.tournamentRequests.list({ tournamentId });
  } catch (error) {
    console.error('[loadTournamentRequests]', error);
    return EMPTY_TEAM_REQUESTS;
  }
}
