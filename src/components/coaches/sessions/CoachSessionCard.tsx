'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, CalendarX, Clock, Info, Star, Users } from 'lucide-react';
import {
  CreditToggle,
  type CreditToggleLabels,
} from '@/components/bookings/CreditToggle';
import {
  CancelPanel,
  type CancelPanelLabels,
} from '@/components/bookings/CancelPanel';
import {
  fillTemplate,
  formatAmount,
  type CancelBookingResult,
  type CompensationValue,
} from '@/lib/bookings/booking';
import type {
  CancelSessionResult,
  CoachSessionItem,
} from '@/lib/coaches/coach-session';
import {
  computePaymentSplit,
  fromCents,
  toCents,
} from '@/lib/bookings/payment-split';
import type { ReviewInput, SubmitReviewResult } from '@/lib/reviews/review';
import {
  ReviewForm,
  type ReviewFormLabels,
} from '@/components/reviews/ReviewForm';
import { StarRating } from '@/components/reviews/StarRating';
import {
  OpenChatButton,
  type OpenChatLabels,
} from '@/components/chat/OpenChatButton';
import {
  TeamSplitProgress,
  type TeamSplitLabels,
} from '@/components/teams/TeamSplitProgress';

export interface SessionReviewLabels {
  write: string;
  yourReview: string;
  stars: string;
  form: ReviewFormLabels;
}

export interface CoachSessionCardLabels {
  statusRequested: string;
  statusAwaitingPayment: string;
  statusConfirmed: string;
  statusRejected: string;
  statusCancelled: string;
  statusCancelledByCoach: string;
  statusExpired: string;
  payNote: string;
  pay: string;
  paying: string;
  cancelRequest: string;
  cancel: string;
  cancelLocked: string;
  paid: string;
  paidCard: string;
  paidCredit: string;
  refundedCard: string;
  refundedMixed: string;
  refundedCredit: string;
  errorTooLate: string;
  errorConflict: string;
  errorGeneric: string;
  review: SessionReviewLabels;
  split: TeamSplitLabels;
  chat: OpenChatLabels;
  credit: CreditToggleLabels;
  panel: CancelPanelLabels;
}

export interface CoachSessionCardProps {
  item: CoachSessionItem;
  labels: CoachSessionCardLabels;
  lng: string;
  balance: number;
  onPay: (
    id: string,
    useCredit: boolean,
  ) => Promise<'ok' | 'conflict' | 'error'>;
  onCancel: (
    id: string,
    compensation: CompensationValue | null,
  ) => Promise<CancelSessionResult>;
  onReview: (id: string, input: ReviewInput) => Promise<SubmitReviewResult>;
  onReviewed: (id: string, input: ReviewInput) => void;
}

const badgeBase =
  'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

function badgeFor(
  item: CoachSessionItem,
  labels: CoachSessionCardLabels,
): { text: string; className: string } {
  switch (item.state) {
    case 'CONFIRMED':
      return {
        text: labels.statusConfirmed,
        className: 'bg-accent text-accent-foreground',
      };
    case 'AWAITING_PAYMENT':
      return {
        text: labels.statusAwaitingPayment,
        className: 'bg-secondary text-muted-foreground',
      };
    case 'REQUESTED':
      return {
        text: labels.statusRequested,
        className: 'bg-secondary text-muted-foreground',
      };
    case 'REJECTED':
      return {
        text: labels.statusRejected,
        className: 'bg-secondary text-destructive',
      };
    case 'EXPIRED':
      return {
        text: labels.statusExpired,
        className: 'bg-secondary text-destructive',
      };
    default:
      return {
        text: item.cancelledByCoach
          ? labels.statusCancelledByCoach
          : labels.statusCancelled,
        className: 'bg-secondary text-destructive',
      };
  }
}

function refundedText(
  item: CoachSessionItem,
  labels: CoachSessionCardLabels,
): string {
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

function paidBreakdown(
  item: CoachSessionItem,
  labels: CoachSessionCardLabels,
): string {
  const parts: string[] = [];
  if (item.card) {
    parts.push(fillTemplate(labels.paidCard, { amount: item.card }));
  }
  if (item.credit) {
    parts.push(fillTemplate(labels.paidCredit, { amount: item.credit }));
  }
  return parts.join(' · ');
}

export function CoachSessionCard({
  item,
  labels,
  lng,
  balance,
  onPay,
  onCancel,
  onReview,
  onReviewed,
}: CoachSessionCardProps) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [useCredit, setUseCredit] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [busy, setBusy] = useState<'pay' | 'cancel' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const badge = badgeFor(item, labels);
  const split = computePaymentSplit(
    toCents(item.price),
    toCents(balance),
    useCredit,
  );

  function messageFor(status: CancelBookingResult['status'] | 'ok'): string {
    if (status === 'tooLate') return labels.errorTooLate;
    if (status === 'conflict') return labels.errorConflict;
    return labels.errorGeneric;
  }

  async function handlePay() {
    if (busy) return;

    setBusy('pay');
    setError(null);

    const status = await onPay(item.id, useCredit);

    setBusy(null);

    if (status === 'ok') return;
    setError(
      status === 'conflict' ? labels.errorConflict : labels.errorGeneric,
    );
  }

  async function handleCancel(compensation: CompensationValue | null) {
    if (busy) return;

    setBusy('cancel');
    setError(null);

    const result = await onCancel(item.id, compensation);

    setBusy(null);

    if (result.status === 'ok') return;
    setError(messageFor(result.status));
  }

  return (
    <li className="rounded-xl border-[0.5px] border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={item.coachHref}
          className="text-base font-medium text-foreground hover:underline"
        >
          {item.coachName}
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

      {item.state === 'CONFIRMED' ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t-[0.5px] border-border pt-3 text-sm text-muted-foreground">
          <span>{fillTemplate(labels.paid, { amount: item.total })}</span>
          <span>{paidBreakdown(item, labels)}</span>
        </div>
      ) : (
        <p className="mt-3 border-t-[0.5px] border-border pt-3 text-sm text-muted-foreground">
          {item.total}
        </p>
      )}

      {item.state === 'AWAITING_PAYMENT' || item.state === 'CONFIRMED' ? (
        <div className="mt-3">
          <OpenChatButton
            target={{ kind: 'coach', id: item.id }}
            labels={labels.chat}
          />
        </div>
      ) : null}

      {item.state === 'CONFIRMED' && item.split ? (
        <TeamSplitProgress split={item.split} lng={lng} labels={labels.split} />
      ) : null}

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

      {item.state === 'CANCELLED' && item.wasPaid ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {refundedText(item, labels)}
        </p>
      ) : null}

      {item.state === 'AWAITING_PAYMENT' ? (
        <>
          <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {fillTemplate(labels.payNote, { deadline: item.payBy ?? '' })}
          </p>
          <div className="mt-3">
            <CreditToggle
              balanceText={formatAmount(balance, lng)}
              hasBalance={balance > 0}
              checked={useCredit}
              limited={split.limited}
              labels={labels.credit}
              onChange={setUseCredit}
            />
          </div>
          <button
            type="button"
            disabled={busy !== null}
            onClick={handlePay}
            className="mt-3 h-11 w-full rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === 'pay'
              ? labels.paying
              : fillTemplate(labels.pay, {
                  amount: formatAmount(
                    split.cardCents > 0
                      ? fromCents(split.cardCents)
                      : item.price,
                    lng,
                  ),
                })}
          </button>
        </>
      ) : null}

      {item.state === 'REQUESTED' ? (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => handleCancel(null)}
          className="mt-3 h-11 w-full rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === 'cancel' ? labels.paying : labels.cancelRequest}
        </button>
      ) : null}

      {item.state === 'CONFIRMED' && !item.reviewable && !panelOpen ? (
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

      {item.state === 'CONFIRMED' && item.canCancel && panelOpen ? (
        <CancelPanel
          total={item.total}
          card={item.card}
          credit={item.credit}
          busy={busy === 'cancel'}
          error={error}
          labels={labels.panel}
          onBack={() => {
            setPanelOpen(false);
            setError(null);
          }}
          onConfirm={handleCancel}
        />
      ) : null}

      {error && !panelOpen ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </li>
  );
}
