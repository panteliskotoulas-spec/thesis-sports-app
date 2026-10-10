import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/trpc/server/routers/_app';
import type { ArchiveOutcome } from '@/lib/fields/owner';

export type ArchiveResult =
  | { status: 'ok' }
  | { status: 'blocked'; futureReservations: number }
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

export async function archiveField(id: string): Promise<ArchiveResult> {
  try {
    const outcome: ArchiveOutcome = await client.fieldOwner.archive.mutate({
      id,
    });
    if (outcome.archived) return { status: 'ok' };
    return {
      status: 'blocked',
      futureReservations: outcome.futureReservations,
    };
  } catch {
    return { status: 'error' };
  }
}
