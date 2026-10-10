import { createTRPCClient, httpBatchLink, TRPCClientError } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/trpc/server/routers/_app';
import type {
  CreateSlotInput,
  CreateSlotResult,
  DeleteSlotResult,
} from '@/lib/fields/owner-slots';

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

export async function createSlot(
  input: CreateSlotInput,
): Promise<CreateSlotResult> {
  try {
    await client.fieldOwner.createSlot.mutate(input);
    return { status: 'ok' };
  } catch (error) {
    const code = errorCode(error);
    if (code === 'CONFLICT') return { status: 'overlap' };
    if (code === 'BAD_REQUEST') return { status: 'invalid' };
    return { status: 'error' };
  }
}

export async function deleteSlot(id: string): Promise<DeleteSlotResult> {
  try {
    await client.fieldOwner.deleteSlot.mutate({ id });
    return { status: 'ok' };
  } catch (error) {
    if (errorCode(error) === 'CONFLICT') return { status: 'conflict' };
    return { status: 'error' };
  }
}
