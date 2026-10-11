import { createTRPCClient, httpBatchLink, TRPCClientError } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/trpc/server/routers/_app';
import type { OwnerCancelResult } from '@/lib/bookings/owner-booking';

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

export async function cancelOwnerBooking(
  reservationId: string,
): Promise<OwnerCancelResult> {
  try {
    await client.ownerBookings.cancel.mutate({ reservationId });
    return { status: 'ok' };
  } catch (error) {
    if (errorCode(error) === 'CONFLICT') return { status: 'conflict' };
    return { status: 'error' };
  }
}
