'use client';

import { useId, useState, type FormEvent } from 'react';
import { fillTemplate } from '@/lib/bookings/booking';
import {
  isValidRating,
  REVIEW_COMMENT_MAX,
  type ReviewInput,
  type SubmitReviewResult,
} from '@/lib/reviews/review';
import { StarRatingInput, type StarRatingInputLabels } from './StarRatingInput';

export interface ReviewFormLabels {
  prompt: string;
  commentLabel: string;
  commentPlaceholder: string;
  counter: string;
  submit: string;
  submitting: string;
  cancel: string;
  errorRating: string;
  errorConflict: string;
  errorForbidden: string;
  errorGeneric: string;
  rating: StarRatingInputLabels;
}

export interface ReviewFormProps {
  labels: ReviewFormLabels;
  onSubmit: (input: ReviewInput) => Promise<SubmitReviewResult>;
  onSubmitted: (input: ReviewInput) => void;
  onCancel: () => void;
}

export function ReviewForm({
  labels,
  onSubmit,
  onSubmitted,
  onCancel,
}: ReviewFormProps) {
  const id = useId();
  const ratingErrorId = `${id}-rating-error`;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [ratingError, setRatingError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function messageFor(result: SubmitReviewResult): string {
    if (result === 'conflict') return labels.errorConflict;
    if (result === 'forbidden') return labels.errorForbidden;
    return labels.errorGeneric;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    if (!isValidRating(rating)) {
      setRatingError(true);
      return;
    }

    setBusy(true);
    setError(null);

    const input: ReviewInput = { rating, comment: comment.trim() };
    const result = await onSubmit(input);

    setBusy(false);

    if (result === 'ok') {
      onSubmitted(input);
      return;
    }

    setError(messageFor(result));
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-3 flex flex-col gap-3 border-t-[0.5px] border-border pt-3"
    >
      <p className="text-sm font-medium">{labels.prompt}</p>

      <StarRatingInput
        value={rating}
        labels={labels.rating}
        invalid={ratingError}
        describedBy={ratingError ? ratingErrorId : undefined}
        onChange={(value) => {
          setRating(value);
          setRatingError(false);
        }}
      />
      {ratingError ? (
        <p id={ratingErrorId} role="alert" className="text-sm text-destructive">
          {labels.errorRating}
        </p>
      ) : null}

      <div>
        <label htmlFor={`${id}-comment`} className="text-sm">
          {labels.commentLabel}
        </label>
        <textarea
          id={`${id}-comment`}
          value={comment}
          rows={3}
          maxLength={REVIEW_COMMENT_MAX}
          placeholder={labels.commentPlaceholder}
          onChange={(event) => setComment(event.target.value)}
          className="mt-1.5 w-full resize-none rounded-xl border-[0.5px] border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {fillTemplate(labels.counter, {
            count: String(comment.length),
            max: String(REVIEW_COMMENT_MAX),
          })}
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? labels.submitting : labels.submit}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="h-11 rounded-full border-[0.5px] border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {labels.cancel}
        </button>
      </div>
    </form>
  );
}
