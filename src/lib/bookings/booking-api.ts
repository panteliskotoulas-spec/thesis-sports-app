import { createTRPCClient, httpBatchLink, TRPCClientError } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/trpc/server/routers/_app';
import type {
  CancelBookingInput,
  CancelBookingResult,
  StartCheckoutInput,
  StartCheckoutResult,
} from '@/lib/bookings/booking';

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

export async function startCheckout(
  input: StartCheckoutInput,
): Promise<StartCheckoutResult> {
  try {
    const result = await client.reservations.startCheckout.mutate({
      slotId: input.slotId,
      useCredit: input.useCredit,
      lng: input.lng === 'en' ? 'en' : 'el',
    });
    if (result.url) return { status: 'redirect', url: result.url };
    return { status: 'confirmed' };
  } catch (error) {
    const code = errorCode(error);
    if (code === 'CONFLICT') return { status: 'conflict' };
    if (code === 'UNAUTHORIZED') return { status: 'unauthorized' };
    if (code === 'BAD_REQUEST') return { status: 'invalid' };
    return { status: 'error' };
  }
}

export async function cancelBooking(
  input: CancelBookingInput,
): Promise<CancelBookingResult> {
  try {
    await client.reservations.cancel.mutate(input);
    return { status: 'ok' };
  } catch (error) {
    const code = errorCode(error);
    if (code === 'PRECONDITION_FAILED') return { status: 'tooLate' };
    if (code === 'CONFLICT') return { status: 'conflict' };
    return { status: 'error' };
  }
}
