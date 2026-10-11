'use client';

import { useId, useState } from 'react';
import { Star } from 'lucide-react';
import { fillTemplate } from '@/lib/bookings/booking';
import { REVIEW_RATINGS } from '@/lib/reviews/review';

export interface StarRatingInputLabels {
  legend: string;
  star: string;
  choose: string;
  names: [string, string, string, string, string];
}

export interface StarRatingInputProps {
  value: number;
  labels: StarRatingInputLabels;
  invalid?: boolean;
  describedBy?: string;
  onChange: (value: number) => void;
}

export function StarRatingInput({
  value,
  labels,
  invalid = false,
  describedBy,
  onChange,
}: StarRatingInputProps) {
  const name = useId();
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <fieldset
      aria-describedby={describedBy}
      aria-invalid={invalid ? true : undefined}
    >
      <legend className="sr-only">{labels.legend}</legend>
      <div className="flex items-center gap-3">
        <div className="flex" onMouseLeave={() => setHover(0)}>
          {REVIEW_RATINGS.map((rating) => (
            <label
              key={rating}
              onMouseEnter={() => setHover(rating)}
              className="cursor-pointer rounded-md p-1 has-focus-visible:outline-2 has-focus-visible:outline-offset-2"
            >
              <input
                type="radio"
                name={name}
                value={rating}
                checked={value === rating}
                onChange={() => onChange(rating)}
                className="sr-only"
              />
              <span className="sr-only">
                {fillTemplate(labels.star, { rating: String(rating) })}
              </span>
              <Star
                className={`size-8 ${
                  rating <= shown
                    ? 'fill-terracotta text-terracotta'
                    : 'text-muted-foreground'
                }`}
                aria-hidden="true"
              />
            </label>
          ))}
        </div>
        <span className="text-sm text-muted-foreground" aria-hidden="true">
          {shown > 0 ? labels.names[shown - 1] : labels.choose}
        </span>
      </div>
    </fieldset>
  );
}
