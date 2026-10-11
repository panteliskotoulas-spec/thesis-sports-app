import { createTRPCClient, httpBatchLink, TRPCClientError } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/trpc/server/routers/_app';
import type {
  ReviewInput,
  ReviewPage,
  SubmitReviewResult,
} from '@/lib/reviews/review';

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

export function listFieldReviews(
  fieldId: string,
  offset: number,
  limit: number,
): Promise<ReviewPage> {
  return client.fieldReviews.list.query({ fieldId, offset, limit });
}

export async function submitFieldReview(
  reservationId: string,
  input: ReviewInput,
): Promise<SubmitReviewResult> {
  try {
    await client.fieldReviews.create.mutate({
      reservationId,
      rating: input.rating,
      comment: input.comment,
    });
    return 'ok';
  } catch (error) {
    const code = errorCode(error);
    if (code === 'CONFLICT') return 'conflict';
    if (code === 'FORBIDDEN') return 'forbidden';
    return 'error';
  }
}
