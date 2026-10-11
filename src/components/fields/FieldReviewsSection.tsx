'use client';

import { listFieldReviews } from '@/lib/fields/field-review-api';
import {
  ReviewsSection,
  type ReviewsSectionProps,
} from '@/components/reviews/ReviewsSection';

export interface FieldReviewsSectionProps extends Omit<
  ReviewsSectionProps,
  'loadMore'
> {
  fieldId: string;
}

export function FieldReviewsSection({
  fieldId,
  ...props
}: FieldReviewsSectionProps) {
  return (
    <ReviewsSection
      {...props}
      loadMore={(offset, limit) => listFieldReviews(fieldId, offset, limit)}
    />
  );
}
