'use client';

import { Calendar, Clock, Users } from 'lucide-react';
import { fillTemplate } from '@/lib/bookings/booking';
import type { CoachRequestItem } from '@/lib/coaches/coach-session';

export interface CoachRequestCardLabels {
  individual: string;
  accept: string;
  reject: string;
  working: string;
  paid: string;
  awaitingPayment: string;
  paymentExpired: string;
}

export interface CoachRequestCardProps {
  item: CoachRequestItem;
  busy: 'accept' | 'reject' | null;
  disabled: boolean;
  labels: CoachRequestCardLabels;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

const badgeBase =
  'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
const buttonBase =
  'inline-flex h-11 flex-1 items-center justify-center rounded-full px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60';

function paymentBadge(
  item: CoachRequestItem,
  labels: CoachRequestCardLabels,
): { text: string; className: string } | null {
  if (item.state !== 'ACCEPTED' || !item.payment) return null;
  if (item.payment === 'PAID') {
    return {
      text: labels.paid,
      className: 'bg-accent text-accent-foreground',
    };
  }
  if (item.payment === 'EXPIRED') {
    return {
      text: labels.paymentExpired,
      className: 'bg-secondary text-destructive',
    };
  }
  return {
    text: fillTemplate(labels.awaitingPayment, { deadline: item.payBy ?? '' }),
    className: 'bg-secondary text-muted-foreground',
  };
}

export function CoachRequestCard({
  item,
  busy,
  disabled,
  labels,
  onAccept,
  onReject,
}: CoachRequestCardProps) {
  const badge = paymentBadge(item, labels);

  return (
    <li className="rounded-xl border-[0.5px] border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground"
          >
            {item.initial}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {item.requesterName}
            </p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {item.teamName ? (
                <>
                  <Users className="size-3.5 shrink-0" aria-hidden="true" />
                  {item.teamName}
                </>
              ) : (
                labels.individual
              )}
            </p>
          </div>
        </div>
        <span className="shrink-0 font-medium text-foreground">
          {item.price}
        </span>
      </div>

      <ul className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <Calendar className="size-4 shrink-0" aria-hidden="true" />
          {item.date}
        </li>
        <li className="flex items-center gap-2">
          <Clock className="size-4 shrink-0" aria-hidden="true" />
          {item.time}
        </li>
      </ul>

      {item.state === 'PENDING' ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAccept(item.id)}
            className={`${buttonBase} bg-primary text-primary-foreground hover:opacity-90`}
          >
            {busy === 'accept' ? labels.working : labels.accept}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onReject(item.id)}
            className={`${buttonBase} border-[0.5px] border-border bg-card text-foreground hover:bg-secondary`}
          >
            {busy === 'reject' ? labels.working : labels.reject}
          </button>
        </div>
      ) : null}

      {badge ? (
        <div className="mt-3">
          <span className={`${badgeBase} ${badge.className}`}>
            {badge.text}
          </span>
        </div>
      ) : null}
    </li>
  );
}
