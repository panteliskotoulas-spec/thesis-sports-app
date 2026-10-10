'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, CalendarX, Clock } from 'lucide-react';
import {
  fillTemplate,
  type BookingItem,
  type CancelBookingResult,
  type CompensationValue,
} from '@/lib/bookings/booking';
import { CancelPanel, type CancelPanelLabels } from './CancelPanel';

export interface BookingCardLabels {
  statusConfirmed: string;
  statusCompleted: string;
  statusCancelled: string;
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
  panel: CancelPanelLabels;
}

export interface BookingCardProps {
  item: BookingItem;
  labels: BookingCardLabels;
  onCancel: (
    id: string,
    compensation: CompensationValue,
  ) => Promise<CancelBookingResult>;
}

const badgeBase =
  'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

function badgeFor(
  item: BookingItem,
  labels: BookingCardLabels,
): { text: string; className: string } {
  if (item.status === 'CANCELLED') {
    return {
      text: labels.statusCancelled,
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

export function BookingCard({ item, labels, onCancel }: BookingCardProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <li className="rounded-xl border-[0.5px] border-border bg-card p-4">
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
