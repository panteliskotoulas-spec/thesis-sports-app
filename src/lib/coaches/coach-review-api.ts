import {
  isValidRating,
  summarizeRatings,
  type ReviewEntry,
  type ReviewInput,
  type ReviewPage,
  type SubmitReviewResult,
} from '@/lib/reviews/review';
import { getMockCoachReviews } from '@/lib/reviews/mock-reviews';

const submitted = new Set<string>();
const added = new Map<string, ReviewEntry[]>();

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function listCoachReviews(
  coachId: string,
  offset: number,
  limit: number,
): Promise<ReviewPage> {
  await wait(400);

  const all = [...(added.get(coachId) ?? []), ...getMockCoachReviews(coachId)];

  return {
    items: all.slice(offset, offset + limit),
    total: all.length,
    rating: summarizeRatings(all.map((review) => review.rating)),
  };
}

export async function submitCoachReview(
  sessionId: string,
  coachId: string,
  input: ReviewInput,
): Promise<SubmitReviewResult> {
  await wait(600);

  if (!isValidRating(input.rating)) return 'error';
  if (submitted.has(sessionId)) return 'conflict';

  submitted.add(sessionId);
  added.set(coachId, [
    {
      id: `${sessionId}-review`,
      reviewerName: 'Εσύ',
      rating: input.rating,
      comment: input.comment.trim() || null,
      createdAt: new Date(),
    },
    ...(added.get(coachId) ?? []),
  ]);

  return 'ok';
}
