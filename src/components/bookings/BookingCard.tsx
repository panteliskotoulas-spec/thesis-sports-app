'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Calendar, CalendarX, Clock, Star, Users } from 'lucide-react';
import {
  fillTemplate,
  type BookingItem,
  type CancelBookingResult,
  type CompensationValue,
} from '@/lib/bookings/booking';
import type { ReviewInput, SubmitReviewResult } from '@/lib/reviews/review';
import {
  ReviewForm,
  type ReviewFormLabels,
} from '@/components/reviews/ReviewForm';
import { StarRating } from '@/components/reviews/StarRating';
import { CancelPanel, type CancelPanelLabels } from './CancelPanel';

export interface BookingReviewLabels {
  write: string;
  yourReview: string;
  stars: string;
  form: ReviewFormLabels;
}

export interface BookingCardLabels {
  statusConfirmed: string;
  statusCompleted: string;
  statusCancelled: string;
  statusCancelledByOwner: string;
  paid: string;
  paidCard: string;
  paidCredit: string;
  cancel: string;
  cancelLocked: string;
  refundedCard: string;
  refundedMixed: string;
  refundedCredit: string;
  errorTooLate: string;
  errorConflict: string;
  errorGeneric: string;
  review: BookingReviewLabels;
  panel: CancelPanelLabels;
}

export interface BookingCardProps {
  item: BookingItem;
  highlighted?: boolean;
  labels: BookingCardLabels;
  onCancel: (
    id: string,
    compensation: CompensationValue,
  ) => Promise<CancelBookingResult>;
  onReview: (id: string, input: ReviewInput) => Promise<SubmitReviewResult>;
  onReviewed: (id: string, input: ReviewInput) => void;
}

const badgeBase =
  'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

function badgeFor(
  item: BookingItem,
  labels: BookingCardLabels,
): { text: string; className: string } {
  if (item.status === 'CANCELLED') {
    return {
      text:
        item.cancelledBy === 'OWNER'
          ? labels.statusCancelledByOwner
          : labels.statusCancelled,
      className: 'bg-secondary text-muted-foreground',
    };
  }
  if (item.phase === 'past') {
    return {
      text: labels.statusCompleted,
      className: 'bg-secondary text-muted-foreground',
    };
  }
  return {
    text: labels.statusConfirmed,
    className: 'bg-accent text-accent-foreground',
  };
}

function refundedText(item: BookingItem, labels: BookingCardLabels): string {
  if (item.compensation === 'CREDIT') {
    return fillTemplate(labels.refundedCredit, { amount: item.total });
  }
  if (item.card && item.credit) {
    return fillTemplate(labels.refundedMixed, {
      card: item.card,
      credit: item.credit,
    });
  }
  if (item.card) {
    return fillTemplate(labels.refundedCard, { amount: item.card });
  }
  return fillTemplate(labels.refundedCredit, { amount: item.total });
}

function paidBreakdown(item: BookingItem, labels: BookingCardLabels): string {
  const parts: string[] = [];
  if (item.card) {
    parts.push(fillTemplate(labels.paidCard, { amount: item.card }));
  }
  if (item.credit) {
    parts.push(fillTemplate(labels.paidCredit, { amount: item.credit }));
  }
  return parts.join(' · ');
}

export function BookingCard({
  item,
  highlighted = false,
  labels,
  onCancel,
  onReview,
  onReviewed,
}: BookingCardProps) {
  const ref = useRef<HTMLLIElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (highlighted) {
      ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [highlighted]);

  const badge = badgeFor(item, labels);
  const cancelled = item.status === 'CANCELLED';
  const upcomingConfirmed =
    item.status === 'CONFIRMED' && item.phase === 'upcoming';

  async function handleConfirm(compensation: CompensationValue) {
    if (busy) return;

    setBusy(true);
    setError(null);

    const result = await onCancel(item.id, compensation);

    setBusy(false);

    if (result.status === 'ok') return;

    setError(
      result.status === 'tooLate'
        ? labels.errorTooLate
        : result.status === 'conflict'
          ? labels.errorConflict
          : labels.errorGeneric,
    );
  }

  return (
    <li
      ref={ref}
      className={`rounded-xl border-[0.5px] bg-card p-4 ${
        highlighted ? 'border-primary ring-1 ring-primary' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <Link
          href={item.fieldHref}
          className="text-base font-medium text-foreground hover:underline"
        >
          {item.fieldName}
        </Link>
        <span className={`${badgeBase} ${badge.className}`}>{badge.text}</span>
      </div>

      <ul className="mt-2.5 flex flex-col gap-1.5 text-sm text-muted-foreground">
        <li>{item.sport}</li>
        {item.teamName ? (
          <li className="flex items-center gap-2">
            <Users className="size-4 shrink-0" aria-hidden="true" />
            {item.teamName}
          </li>
        ) : null}
        <li className="flex items-center gap-2">
          <Calendar className="size-4 shrink-0" aria-hidden="true" />
          {item.date}
        </li>
        <li className="flex items-center gap-2">
          <Clock className="size-4 shrink-0" aria-hidden="true" />
          {item.time}
        </li>
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t-[0.5px] border-border pt-3 text-sm text-muted-foreground">
        <span>{fillTemplate(labels.paid, { amount: item.total })}</span>
        <span>{paidBreakdown(item, labels)}</span>
      </div>

      {item.reviewable ? (
        item.review ? (
          <div className="mt-3 border-t-[0.5px] border-border pt-3">
            <p className="text-sm text-muted-foreground">
              {labels.review.yourReview}
            </p>
            <div className="mt-1">
              <StarRating
                value={item.review.rating}
                label={fillTemplate(labels.review.stars, {
                  rating: String(item.review.rating),
                })}
              />
            </div>
            {item.review.comment ? (
              <p className="mt-1.5 text-sm text-muted-foreground">
                {item.review.comment}
              </p>
            ) : null}
          </div>
        ) : reviewOpen ? (
          <ReviewForm
            labels={labels.review.form}
            onSubmit={(input) => onReview(item.id, input)}
            onSubmitted={(input) => {
              setReviewOpen(false);
              onReviewed(item.id, input);
            }}
            onCancel={() => setReviewOpen(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setReviewOpen(true)}
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary"
          >
            <Star className="size-4" aria-hidden="true" />
            {labels.review.write}
          </button>
        )
      ) : null}

      {cancelled ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {refundedText(item, labels)}
        </p>
      ) : null}

      {upcomingConfirmed && !panelOpen ? (
        item.canCancel ? (
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="mt-3 h-11 w-full rounded-full border-[0.5px] border-terracotta bg-card px-4 text-sm font-medium text-terracotta hover:bg-secondary"
          >
            {labels.cancel}
          </button>
        ) : (
          <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
            <CalendarX className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {labels.cancelLocked}
          </p>
        )
      ) : null}

      {upcomingConfirmed && item.canCancel && panelOpen ? (
        <CancelPanel
          total={item.total}
          card={item.card}
          credit={item.credit}
          busy={busy}
          error={error}
          labels={labels.panel}
          onBack={() => {
            setPanelOpen(false);
            setError(null);
          }}
          onConfirm={handleConfirm}
        />
      ) : null}
    </li>
  );
}
