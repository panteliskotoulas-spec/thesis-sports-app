import { client, run, type AdminActionResult } from './admin-api';

export function applyToTournament(
  tournamentId: string,
  teamId: string,
): Promise<AdminActionResult> {
  return run(() =>
    client.tournamentRequests.apply.mutate({ tournamentId, teamId }),
  );
}

export function cancelTeamRequest(
  requestId: string,
): Promise<AdminActionResult> {
  return run(() => client.tournamentRequests.cancel.mutate({ requestId }));
}

export function acceptTeamRequest(
  requestId: string,
): Promise<AdminActionResult> {
  return run(() => client.tournamentRequests.accept.mutate({ requestId }));
}

export function rejectTeamRequest(
  requestId: string,
): Promise<AdminActionResult> {
  return run(() => client.tournamentRequests.reject.mutate({ requestId }));
}
