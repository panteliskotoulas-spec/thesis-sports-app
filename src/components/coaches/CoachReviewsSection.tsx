'use client';

import { listCoachReviews } from '@/lib/coaches/coach-review-api';
import {
  ReviewsSection,
  type ReviewsSectionProps,
} from '@/components/reviews/ReviewsSection';

export interface CoachReviewsSectionProps extends Omit<
  ReviewsSectionProps,
  'loadMore'
> {
  coachId: string;
}

export function CoachReviewsSection({
  coachId,
  ...props
}: CoachReviewsSectionProps) {
  return (
    <ReviewsSection
      {...props}
      loadMore={(offset, limit) => listCoachReviews(coachId, offset, limit)}
    />
  );
}
