'use client';

import { Trash2 } from 'lucide-react';
import type { OwnerSlotItem, SlotStatusValue } from '@/lib/fields/owner-slots';

export interface SlotListLabels {
  heading: string;
  empty: string;
  statusOpen: string;
  statusPending: string;
  statusBooked: string;
  delete: string;
  working: string;
}

export interface SlotListProps {
  slots: OwnerSlotItem[];
  deletingId: string | null;
  labels: SlotListLabels;
  onDelete: (id: string) => void;
}

const badgeBase =
  'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

function badgeFor(
  status: SlotStatusValue,
  labels: SlotListLabels,
): { text: string; className: string } {
  if (status === 'OPEN') {
    return {
      text: labels.statusOpen,
      className: 'bg-accent text-accent-foreground',
    };
  }
  if (status === 'PENDING_PAYMENT') {
    return {
      text: labels.statusPending,
      className: 'bg-secondary text-terracotta',
    };
  }
  return {
    text: labels.statusBooked,
    className: 'bg-secondary text-muted-foreground',
  };
}

export function SlotList({
  slots,
  deletingId,
  labels,
  onDelete,
}: SlotListProps) {
  if (slots.length === 0) {
    return (
      <div className="rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">
        {labels.empty}
      </div>
    );
  }

  return (
    <div>
      <h3 className="sr-only">{labels.heading}</h3>
      <ul className="overflow-hidden rounded-xl border-[0.5px] border-border bg-card">
        {slots.map((slot) => {
          const badge = badgeFor(slot.status, labels);
          const busy = deletingId === slot.id;
          return (
            <li
              key={slot.id}
              className="flex items-center justify-between gap-3 border-b-[0.5px] border-border px-3.5 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{slot.time}</p>
                <p className="text-sm text-muted-foreground">
                  {slot.sport} · {slot.price}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`${badgeBase} ${badge.className}`}>
                  {badge.text}
                </span>
                {slot.status === 'OPEN' ? (
                  <button
                    type="button"
                    disabled={deletingId !== null}
                    aria-label={busy ? labels.working : labels.delete}
                    onClick={() => onDelete(slot.id)}
                    className="inline-flex size-10 items-center justify-center rounded-full border-[0.5px] border-border bg-card text-destructive hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="size-4.5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
