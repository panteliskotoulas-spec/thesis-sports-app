'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import {
  computePaymentSplit,
  toCents,
  fromCents,
} from '@/lib/bookings/payment-split';
import { chipBase, chipOff, chipOn } from '@/components/fields/chipStyles';
import { formatAmount, type CompensationValue } from '@/lib/bookings/booking';
import { submitCoachReview } from '@/lib/coaches/coach-review-api';
import {
  cancelCoachSession,
  payCoachSession,
} from '@/lib/coaches/coach-session-api';
import type { ReviewInput, SubmitReviewResult } from '@/lib/reviews/review';
import type {
  CancelSessionResult,
  CoachSessionItem,
  CoachSessionState,
} from '@/lib/coaches/coach-session';
import {
  CoachSessionCard,
  type CoachSessionCardLabels,
} from './CoachSessionCard';

export interface CoachSessionsListLabels {
  tabAll: string;
  tabWaiting: string;
  tabPay: string;
  tabConfirmed: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction: string;
  paidNotice: string;
  cancelledNotice: string;
  requestCancelledNotice: string;
  reviewedNotice: string;
  card: CoachSessionCardLabels;
}

export interface CoachSessionsListProps {
  items: CoachSessionItem[];
  lng: string;
  balance: number;
  justPaid: boolean;
  browseHref: string;
  labels: CoachSessionsListLabels;
}

type Filter = 'ALL' | CoachSessionState;

export function CoachSessionsList({
  items: initialItems,
  lng,
  balance: initialBalance,
  justPaid,
  browseHref,
  labels,
}: CoachSessionsListProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [balance, setBalance] = useState(initialBalance);
  const [notice, setNotice] = useState<string | null>(
    justPaid ? labels.paidNotice : null,
  );

  const filters: { value: Filter; label: string }[] = [
    { value: 'ALL', label: labels.tabAll },
    { value: 'REQUESTED', label: labels.tabWaiting },
    { value: 'AWAITING_PAYMENT', label: labels.tabPay },
    { value: 'CONFIRMED', label: labels.tabConfirmed },
  ];

  async function handlePay(
    id: string,
    useCredit: boolean,
  ): Promise<'ok' | 'conflict' | 'error'> {
    const result = await payCoachSession(id, useCredit, lng);

    if (result.status === 'redirect') {
      window.location.assign(result.url);
      return 'ok';
    }

    if (result.status === 'ok') {
      const target = items.find((item) => item.id === id);
      const split = target
        ? computePaymentSplit(
            toCents(target.price),
            toCents(balance),
            useCredit,
          )
        : null;
      const creditCents = split ? split.creditCents : 0;
      const cardCents = split ? split.cardCents : 0;

      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                state: 'CONFIRMED',
                wasPaid: true,
                payBy: null,
                credit:
                  creditCents > 0
                    ? formatAmount(fromCents(creditCents), lng)
                    : null,
                card:
                  cardCents > 0
                    ? formatAmount(fromCents(cardCents), lng)
                    : null,
                creditValue: fromCents(creditCents),
              }
            : item,
        ),
      );
      setBalance((current) => Math.max(0, current - fromCents(creditCents)));
      setNotice(labels.paidNotice);
      router.refresh();
      return 'ok';
    }

    return result.status;
  }

  async function handleCancel(
    id: string,
    compensation: CompensationValue | null,
  ): Promise<CancelSessionResult> {
    const result = await cancelCoachSession({ sessionId: id, compensation });

    if (result.status === 'ok') {
      const cancelled = items.find((item) => item.id === id);
      if (cancelled && cancelled.state === 'CONFIRMED') {
        const back =
          compensation === 'CREDIT' ? cancelled.price : cancelled.creditValue;
        setBalance((current) => current + back);
      }

      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                state: 'CANCELLED',
                compensation,
                canCancel: false,
                payBy: null,
              }
            : item,
        ),
      );
      setNotice(
        compensation ? labels.cancelledNotice : labels.requestCancelledNotice,
      );
      router.refresh();
    }

    return result;
  }

  async function handleReview(
    id: string,
    input: ReviewInput,
  ): Promise<SubmitReviewResult> {
    const target = items.find((item) => item.id === id);
    if (!target) return 'error';
    return submitCoachReview(id, target.coachId, input);
  }

  function handleReviewed(id: string, input: ReviewInput) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              review: { rating: input.rating, comment: input.comment || null },
            }
          : item,
      ),
    );
    setNotice(labels.reviewedNotice);
  }

  const visible = items.filter(
    (item) => filter === 'ALL' || item.state === filter,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto">
        {filters.map((entry) => (
          <button
            key={entry.value}
            type="button"
            aria-pressed={filter === entry.value}
            onClick={() => setFilter(entry.value)}
            className={`${chipBase} ${filter === entry.value ? chipOn : chipOff}`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {notice ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl bg-accent p-3 text-sm text-accent-foreground"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {notice}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div className="rounded-xl border-[0.5px] border-border bg-card p-6 text-center">
          <h2 className="text-lg">{labels.emptyTitle}</h2>
          <p className="mt-1 text-muted-foreground">
            {labels.emptyDescription}
          </p>
          <Link
            href={browseHref}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            {labels.emptyAction}
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((item) => (
            <CoachSessionCard
              key={item.id}
              item={item}
              labels={labels.card}
              lng={lng}
              balance={balance}
              onPay={handlePay}
              onCancel={handleCancel}
              onReview={handleReview}
              onReviewed={handleReviewed}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
