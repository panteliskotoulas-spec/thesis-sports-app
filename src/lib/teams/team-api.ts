import type { TeamActionResult, TeamFormValues } from './team';

async function simulate<T>(value: T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return value;
}

export async function submitNewTeam(
  values: TeamFormValues,
): Promise<{ id: string }> {
  await simulate(values);
  return { id: 'team-1' };
}

export async function updateExistingTeam(
  id: string,
  values: TeamFormValues,
): Promise<{ id: string }> {
  await simulate(values);
  return { id };
}

export async function requestToJoin(teamId: string): Promise<TeamActionResult> {
  await simulate(teamId);
  return { status: 'ok' };
}

export async function cancelJoinRequest(
  requestId: string,
): Promise<TeamActionResult> {
  await simulate(requestId);
  return { status: 'ok' };
}

export async function respondToJoinRequest(
  requestId: string,
  decision: 'ACCEPT' | 'REJECT',
): Promise<TeamActionResult> {
  await simulate({ requestId, decision });
  return { status: 'ok' };
}

export async function leaveTeam(teamId: string): Promise<TeamActionResult> {
  await simulate(teamId);
  return { status: 'ok' };
}

export async function removeTeamMember(
  teamId: string,
  userId: string,
): Promise<TeamActionResult> {
  await simulate({ teamId, userId });
  return { status: 'ok' };
}

export async function transferLeadership(
  teamId: string,
  userId: string,
): Promise<TeamActionResult> {
  await simulate({ teamId, userId });
  return { status: 'ok' };
}

export async function deleteTeam(teamId: string): Promise<TeamActionResult> {
  await simulate(teamId);
  return { status: 'ok' };
}
