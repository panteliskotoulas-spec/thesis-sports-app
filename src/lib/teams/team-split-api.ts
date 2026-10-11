import { createTRPCClient, httpBatchLink, TRPCClientError } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/trpc/server/routers/_app';

export interface StartSplitCheckoutInput {
  reservationId: string;
  useCredit: boolean;
  lng: string;
}

export interface StartSessionSplitCheckoutInput {
  sessionId: string;
  useCredit: boolean;
  lng: string;
}

export type SplitTarget =
  | { kind: 'reservation'; id: string }
  | { kind: 'session'; id: string };

export type StartSplitCheckoutResult =
  | { status: 'redirect'; url: string }
  | { status: 'paid' }
  | { status: 'unavailable' }
  | { status: 'unauthorized' }
  | { status: 'error' };

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

export async function startSplitCheckout(
  input: StartSplitCheckoutInput,
): Promise<StartSplitCheckoutResult> {
  try {
    const result = await client.splits.startCheckout.mutate({
      reservationId: input.reservationId,
      useCredit: input.useCredit,
      lng: input.lng === 'en' ? 'en' : 'el',
    });
    if (result.url) return { status: 'redirect', url: result.url };
    return { status: 'paid' };
  } catch (error) {
    const code = errorCode(error);
    if (code === 'CONFLICT' || code === 'NOT_FOUND') {
      return { status: 'unavailable' };
    }
    if (code === 'UNAUTHORIZED') return { status: 'unauthorized' };
    return { status: 'error' };
  }
}

export async function startSessionSplitCheckout(
  input: StartSessionSplitCheckoutInput,
): Promise<StartSplitCheckoutResult> {
  void input;
  return { status: 'error' };
}
