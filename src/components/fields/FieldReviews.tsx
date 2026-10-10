import { Star } from 'lucide-react';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import type { FieldDetail } from '@/lib/fields/detail';
import { formatReviewDate } from '@/lib/fields/detail-format';
import { formatRating } from '@/lib/fields/format';

export async function FieldReviews({ field }: { field: FieldDetail }) {
  const { t } = await getT('fields');
  const lng = await routeLanguage();

  return (
    <section aria-labelledby="reviews-title">
      <h2 id="reviews-title" className="text-lg">
        {t('detail.reviews.title')}
      </h2>

      {field.rating ? (
        <p className="mt-2 flex items-center gap-2">
          <Star
            className="size-5 fill-terracotta text-terracotta"
            aria-hidden="true"
          />
          <strong className="text-2xl">
            {formatRating(field.rating.average, lng)}
          </strong>
          <span className="text-muted-foreground">
            {t('detail.reviews.count', { count: field.rating.count })}
          </span>
        </p>
      ) : null}

      {field.reviews.length === 0 ? (
        <p className="mt-2 text-muted-foreground">
          {t('detail.reviews.empty')}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {field.reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-xl border-[0.5px] border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {review.reviewerName}{' '}
                  <span className="font-normal text-muted-foreground">
                    · {formatReviewDate(review.createdAt, lng)}
                  </span>
                </p>
                <span
                  className="flex"
                  role="img"
                  aria-label={t('detail.reviews.stars', {
                    rating: review.rating,
                  })}
                >
                  {Array.from({ length: 5 }, (_, position) => (
                    <Star
                      key={position}
                      className={`size-4 ${
                        position < review.rating
                          ? 'fill-terracotta text-terracotta'
                          : 'text-muted-foreground'
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </span>
              </div>
              {review.comment ? (
                <p className="mt-2 text-muted-foreground">{review.comment}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
