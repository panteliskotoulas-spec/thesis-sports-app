import { createTRPCClient, httpBatchLink, TRPCClientError } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/trpc/server/routers/_app';

export type ApprovalResult = 'ok' | 'conflict' | 'error';

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

function toResult(error: unknown): ApprovalResult {
  if (error instanceof TRPCClientError) {
    const code = (error.data as { code?: string } | null | undefined)?.code;
    if (code === 'CONFLICT') return 'conflict';
  }
  return 'error';
}

export async function approveField(id: string): Promise<ApprovalResult> {
  try {
    await client.fieldApproval.approve.mutate({ id });
    return 'ok';
  } catch (error) {
    return toResult(error);
  }
}

export async function rejectField(
  id: string,
  reason: string,
  lng: string,
): Promise<ApprovalResult> {
  try {
    await client.fieldApproval.reject.mutate({
      id,
      reason,
      lng: lng === 'en' ? 'en' : 'el',
    });
    return 'ok';
  } catch (error) {
    return toResult(error);
  }
}
