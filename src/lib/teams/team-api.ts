import { createTRPCClient, httpBatchLink, TRPCClientError } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/trpc/server/routers/_app';
import type { TeamActionResult, TeamFormValues, LogoItem } from './team';

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
      fetch(url, options) {
        return fetch(url, { ...options, credentials: 'include' });
      },
    }),
  ],
});

interface CloudinaryUploadResponse {
  secure_url?: string;
}

function errorCode(error: unknown): string | null {
  if (error instanceof TRPCClientError) {
    return (error.data as { code?: string } | null | undefined)?.code ?? null;
  }
  return null;
}

async function toResult(
  action: () => Promise<unknown>,
): Promise<TeamActionResult> {
  try {
    await action();
    return { status: 'ok' };
  } catch (error) {
    if (errorCode(error) === 'CONFLICT') return { status: 'conflict' };
    return { status: 'error' };
  }
}

async function uploadLogo(file: File): Promise<string> {
  const signature = await client.teams.uploadSignature.mutate();

  const body = new FormData();
  body.append('file', file);
  body.append('api_key', signature.apiKey);
  body.append('timestamp', String(signature.timestamp));
  body.append('folder', signature.folder);
  body.append('allowed_formats', signature.allowedFormats);
  body.append('signature', signature.signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    { method: 'POST', body },
  );
  if (!response.ok) throw new Error('Image upload failed');

  const result = (await response.json()) as CloudinaryUploadResponse;
  if (!result.secure_url) throw new Error('Image upload failed');

  return result.secure_url;
}

async function resolveLogo(logo: LogoItem | null): Promise<string | null> {
  if (!logo) return null;
  if (logo.kind === 'existing') return logo.url;
  return uploadLogo(logo.file);
}

async function toPayload(values: TeamFormValues, lng: string) {
  return {
    lng: lng === 'en' ? ('en' as const) : ('el' as const),
    name: values.name,
    level: values.level,
    area: values.area,
    description: values.description,
    maxMembers: values.maxMembers,
    isRecruiting: values.isRecruiting,
    neededPosition: values.neededPosition,
    logoUrl: await resolveLogo(values.logo),
  };
}

export async function submitNewTeam(
  values: TeamFormValues,
  lng: string,
): Promise<{ id: string }> {
  const payload = await toPayload(values, lng);
  return client.teams.create.mutate({
    ...payload,
    sportType: values.sportType,
  });
}

export async function updateExistingTeam(
  id: string,
  values: TeamFormValues,
  lng: string,
): Promise<{ id: string }> {
  const payload = await toPayload(values, lng);
  return client.teams.update.mutate({ id, ...payload });
}

export function requestToJoin(teamId: string): Promise<TeamActionResult> {
  return toResult(() => client.teams.requestJoin.mutate({ teamId }));
}

export function cancelJoinRequest(
  requestId: string,
): Promise<TeamActionResult> {
  return toResult(() => client.teams.cancelRequest.mutate({ requestId }));
}

export function respondToJoinRequest(
  requestId: string,
  decision: 'ACCEPT' | 'REJECT',
): Promise<TeamActionResult> {
  return toResult(() =>
    client.teams.respond.mutate({ requestId, accept: decision === 'ACCEPT' }),
  );
}

export function leaveTeam(teamId: string): Promise<TeamActionResult> {
  return toResult(() => client.teams.leave.mutate({ teamId }));
}

export function removeTeamMember(
  teamId: string,
  userId: string,
): Promise<TeamActionResult> {
  return toResult(() => client.teams.removeMember.mutate({ teamId, userId }));
}

export function transferLeadership(
  teamId: string,
  userId: string,
): Promise<TeamActionResult> {
  return toResult(() =>
    client.teams.transferLeadership.mutate({ teamId, userId }),
  );
}

export function deleteTeam(teamId: string): Promise<TeamActionResult> {
  return toResult(() => client.teams.delete.mutate({ teamId }));
}
