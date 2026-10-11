'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { fillTemplate } from '@/lib/bookings/booking';
import { formatRating } from '@/lib/fields/format';
import type {
  ReviewEntry,
  ReviewPage,
  ReviewRating,
} from '@/lib/reviews/review';
import { ReviewItem } from './ReviewItem';

export interface ReviewsSectionLabels {
  title: string;
  countOne: string;
  countOther: string;
  empty: string;
  more: string;
  loading: string;
  loadError: string;
  stars: string;
}

export interface ReviewsSectionProps {
  lng: string;
  rating: ReviewRating | null;
  items: ReviewEntry[];
  total: number;
  pageSize: number;
  labels: ReviewsSectionLabels;
  loadMore: (offset: number, limit: number) => Promise<ReviewPage>;
}

export function ReviewsSection({
  lng,
  rating: initialRating,
  items: initialItems,
  total: initialTotal,
  pageSize,
  labels,
  loadMore,
}: ReviewsSectionProps) {
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [rating, setRating] = useState(initialRating);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function handleMore() {
    if (busy) return;

    setBusy(true);
    setError(false);

    try {
      const page = await loadMore(items.length, pageSize);
      setItems((current) => [...current, ...page.items]);
      setTotal(page.total);
      setRating(page.rating);
    } catch {
      setError(true);
    }

    setBusy(false);
  }

  return (
    <section aria-labelledby="reviews-title">
      <h2 id="reviews-title" className="text-lg">
        {labels.title}
      </h2>

      {rating ? (
        <p className="mt-2 flex items-center gap-2">
          <Star
            className="size-5 fill-terracotta text-terracotta"
            aria-hidden="true"
          />
          <strong className="text-2xl">
            {formatRating(rating.average, lng)}
          </strong>
          <span className="text-muted-foreground">
            {fillTemplate(
              rating.count === 1 ? labels.countOne : labels.countOther,
              { count: String(rating.count) },
            )}
          </span>
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="mt-2 text-muted-foreground">{labels.empty}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {items.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              lng={lng}
              starsLabel={labels.stars}
            />
          ))}
        </ul>
      )}

      {items.length < total ? (
        <div className="mt-4">
          <button
            type="button"
            disabled={busy}
            onClick={handleMore}
            className="h-11 rounded-full border-[0.5px] border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? labels.loading : labels.more}
          </button>
          {error ? (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {labels.loadError}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
