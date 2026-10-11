import { createTRPCClient, httpBatchLink, TRPCClientError } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/trpc/server/routers/_app';
import type {
  CancelCoachRequestResult,
  CancelSessionInput,
  CancelSessionResult,
  PaySessionResult,
  RequestSessionInput,
  RequestSessionResult,
  RespondRequestResult,
} from '@/lib/coaches/coach-session';

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

export async function requestCoachSession(
  input: RequestSessionInput,
): Promise<RequestSessionResult> {
  try {
    await client.coachSessions.request.mutate({
      slotId: input.slotId,
      teamId: input.teamId,
    });
    return 'ok';
  } catch (error) {
    const code = errorCode(error);
    if (code === 'CONFLICT') return 'conflict';
    if (code === 'UNAUTHORIZED') return 'unauthorized';
    return 'error';
  }
}

export async function respondCoachRequest(
  requestId: string,
  decision: 'accept' | 'reject',
): Promise<RespondRequestResult> {
  try {
    const result = await client.coachSessions.respond.mutate({
      id: requestId,
      decision,
    });
    return { status: 'ok', payBy: result.payBy };
  } catch (error) {
    if (errorCode(error) === 'CONFLICT') return { status: 'conflict' };
    return { status: 'error' };
  }
}

export async function payCoachSession(
  sessionId: string,
  useCredit: boolean,
  lng: string,
): Promise<PaySessionResult> {
  try {
    const result = await client.coachSessions.pay.mutate({
      sessionId,
      useCredit,
      lng: lng === 'en' ? 'en' : 'el',
    });
    if (result.url) return { status: 'redirect', url: result.url };
    return { status: 'ok' };
  } catch (error) {
    if (errorCode(error) === 'CONFLICT') return { status: 'conflict' };
    return { status: 'error' };
  }
}

export async function cancelCoachSession(
  input: CancelSessionInput,
): Promise<CancelSessionResult> {
  try {
    await client.coachSessions.cancel.mutate({
      sessionId: input.sessionId,
      compensation: input.compensation,
    });
    return { status: 'ok' };
  } catch (error) {
    const code = errorCode(error);
    if (code === 'PRECONDITION_FAILED') return { status: 'tooLate' };
    if (code === 'CONFLICT') return { status: 'conflict' };
    return { status: 'error' };
  }
}

export async function cancelCoachRequest(
  requestId: string,
): Promise<CancelCoachRequestResult> {
  try {
    await client.coachSessions.cancelByCoach.mutate({ sessionId: requestId });
    return { status: 'ok' };
  } catch (error) {
    if (errorCode(error) === 'CONFLICT') return { status: 'conflict' };
    return { status: 'error' };
  }
}
