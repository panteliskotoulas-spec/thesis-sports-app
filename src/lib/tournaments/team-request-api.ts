import type { AdminActionResult } from './admin-api';

const NOT_READY: AdminActionResult = { ok: false, code: 'ERROR' };

export function applyToTournament(
  tournamentId: string,
  teamId: string,
): Promise<AdminActionResult> {
  void tournamentId;
  void teamId;
  return Promise.resolve(NOT_READY);
}

export function cancelTeamRequest(
  requestId: string,
): Promise<AdminActionResult> {
  void requestId;
  return Promise.resolve(NOT_READY);
}

export function acceptTeamRequest(
  requestId: string,
): Promise<AdminActionResult> {
  void requestId;
  return Promise.resolve(NOT_READY);
}

export function rejectTeamRequest(
  requestId: string,
): Promise<AdminActionResult> {
  void requestId;
  return Promise.resolve(NOT_READY);
}
