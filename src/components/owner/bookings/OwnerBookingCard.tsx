'use client';

import { useState } from 'react';
import { Calendar, Clock, User } from 'lucide-react';
import { fillTemplate } from '@/lib/bookings/booking';
import type {
  OwnerBookingItem,
  OwnerCancelResult,
} from '@/lib/bookings/owner-booking';

export interface OwnerBookingCardLabels {
  statusConfirmed: string;
  statusCompleted: string;
  statusCancelledByOwner: string;
  statusCancelledByPlayer: string;
  paid: string;
  paidCard: string;
  paidCredit: string;
  cancel: string;
  refundedCard: string;
  refundedMixed: string;
  refundedCredit: string;
  errorConflict: string;
  errorGeneric: string;
  panelTitle: string;
  panelBodyCard: string;
  panelBodyMixed: string;
  panelBodyCredit: string;
  panelBack: string;
  panelConfirm: string;
  panelWorking: string;
}

export interface OwnerBookingCardProps {
  item: OwnerBookingItem;
  labels: OwnerBookingCardLabels;
  onCancel: (id: string) => Promise<OwnerCancelResult>;
}

const badgeBase =
  'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

function badgeFor(
  item: OwnerBookingItem,
  labels: OwnerBookingCardLabels,
): { text: string; className: string } {
  if (item.status === 'CANCELLED') {
    return {
      text:
        item.cancelledBy === 'OWNER'
          ? labels.statusCancelledByOwner
          : labels.statusCancelledByPlayer,
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

function paidBreakdown(
  item: OwnerBookingItem,
  labels: OwnerBookingCardLabels,
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

function refundTemplate(
  item: OwnerBookingItem,
  card: string,
  mixed: string,
  credit: string,
): string {
  if (item.card && item.credit) {
    return fillTemplate(mixed, { card: item.card, credit: item.credit });
  }
  if (item.card) return fillTemplate(card, { amount: item.card });
  return fillTemplate(credit, { amount: item.credit ?? item.total });
}

export function OwnerBookingCard({
  item,
  labels,
  onCancel,
}: OwnerBookingCardProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const badge = badgeFor(item, labels);
  const cancellable = item.status === 'CONFIRMED' && item.phase === 'upcoming';
  const refundedByOwner =
    item.status === 'CANCELLED' && item.cancelledBy === 'OWNER';

  async function handleConfirm() {
    if (busy) return;

    setBusy(true);
    setError(null);

    const result = await onCancel(item.id);

    setBusy(false);

    if (result.status === 'ok') return;

    setError(
      result.status === 'conflict' ? labels.errorConflict : labels.errorGeneric,
    );
  }

  return (
    <li className="rounded-xl border-[0.5px] border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 wrap-break-word text-base">{item.fieldName}</h3>
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
        <li className="flex items-center gap-2 font-medium text-foreground">
          <User className="size-4 shrink-0" aria-hidden="true" />
          {item.playerName}
        </li>
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t-[0.5px] border-border pt-3 text-sm text-muted-foreground">
        <span>{fillTemplate(labels.paid, { amount: item.total })}</span>
        <span>{paidBreakdown(item, labels)}</span>
      </div>

      {refundedByOwner ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {refundTemplate(
            item,
            labels.refundedCard,
            labels.refundedMixed,
            labels.refundedCredit,
          )}
        </p>
      ) : null}

      {cancellable && !panelOpen ? (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="mt-3 h-11 w-full rounded-full border-[0.5px] border-terracotta bg-card px-4 text-sm font-medium text-terracotta hover:bg-secondary"
        >
          {labels.cancel}
        </button>
      ) : null}

      {cancellable && panelOpen ? (
        <div className="mt-3 border-t-[0.5px] border-border pt-3">
          <p className="font-medium text-foreground">{labels.panelTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {refundTemplate(
              item,
              labels.panelBodyCard,
              labels.panelBodyMixed,
              labels.panelBodyCredit,
            )}
          </p>

          {error ? (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setPanelOpen(false);
                setError(null);
              }}
              className="h-11 rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {labels.panelBack}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleConfirm}
              className="h-11 rounded-full bg-destructive px-4 text-sm font-medium text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? labels.panelWorking : labels.panelConfirm}
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
