import {
  mockListFieldReviews,
  mockSubmitFieldReview,
} from '@/lib/fields/mock-field-reviews';
import type {
  ReviewInput,
  ReviewPage,
  SubmitReviewResult,
} from '@/lib/reviews/review';

export async function listFieldReviews(
  fieldId: string,
  offset: number,
  limit: number,
): Promise<ReviewPage> {
  void fieldId;
  return mockListFieldReviews(offset, limit);
}

export async function submitFieldReview(
  reservationId: string,
  input: ReviewInput,
): Promise<SubmitReviewResult> {
  void reservationId;
  return mockSubmitFieldReview(input);
}
