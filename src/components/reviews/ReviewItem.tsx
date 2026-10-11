import { fillTemplate } from '@/lib/bookings/booking';
import { formatReviewDate } from '@/lib/fields/detail-format';
import type { ReviewEntry } from '@/lib/reviews/review';
import { StarRating } from './StarRating';

export interface ReviewItemProps {
  review: ReviewEntry;
  lng: string;
  starsLabel: string;
}

export function ReviewItem({ review, lng, starsLabel }: ReviewItemProps) {
  return (
    <li className="rounded-xl border-[0.5px] border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">
          {review.reviewerName}{' '}
          <span className="font-normal text-muted-foreground">
            · {formatReviewDate(review.createdAt, lng)}
          </span>
        </p>
        <StarRating
          value={review.rating}
          label={fillTemplate(starsLabel, { rating: String(review.rating) })}
        />
      </div>
      {review.comment ? (
        <p className="mt-2 text-muted-foreground">{review.comment}</p>
      ) : null}
    </li>
  );
}
