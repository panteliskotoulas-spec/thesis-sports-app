import { createTRPCClient, httpBatchLink, TRPCClientError } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/trpc/server/routers/_app';
import type { CoachActionResult, CoachFormValues } from './coach';

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

function errorCode(error: unknown): string | null {
  if (error instanceof TRPCClientError) {
    return (error.data as { code?: string } | null | undefined)?.code ?? null;
  }
  return null;
}

function toResult(error: unknown): CoachActionResult {
  return errorCode(error) === 'CONFLICT' ? 'conflict' : 'error';
}

function toLanguage(lng: string): 'el' | 'en' {
  return lng === 'en' ? 'en' : 'el';
}

export async function saveCoachProfile(
  values: CoachFormValues,
  lng: string,
): Promise<CoachActionResult> {
  try {
    await client.coaches.save.mutate({ ...values, lng: toLanguage(lng) });
    return 'ok';
  } catch (error) {
    return toResult(error);
  }
}

export async function approveCoach(id: string): Promise<CoachActionResult> {
  try {
    await client.coachApproval.approve.mutate({ id });
    return 'ok';
  } catch (error) {
    return toResult(error);
  }
}

export async function rejectCoach(
  id: string,
  reason: string,
  lng: string,
): Promise<CoachActionResult> {
  try {
    await client.coachApproval.reject.mutate({
      id,
      reason,
      lng: toLanguage(lng),
    });
    return 'ok';
  } catch (error) {
    return toResult(error);
  }
}
