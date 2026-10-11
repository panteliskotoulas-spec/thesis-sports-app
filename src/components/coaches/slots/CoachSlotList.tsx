'use client';

import { Trash2 } from 'lucide-react';
import type {
  CoachSlotItem,
  CoachSlotStatusValue,
} from '@/lib/coaches/coach-public';

export interface CoachSlotListLabels {
  heading: string;
  empty: string;
  statusOpen: string;
  statusPending: string;
  statusBooked: string;
  delete: string;
  working: string;
}

export interface CoachSlotListProps {
  slots: CoachSlotItem[];
  deletingId: string | null;
  labels: CoachSlotListLabels;
  onDelete: (id: string) => void;
}

const badgeBase =
  'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

function badgeFor(
  status: CoachSlotStatusValue,
  labels: CoachSlotListLabels,
): { text: string; className: string } {
  if (status === 'OPEN') {
    return {
      text: labels.statusOpen,
      className: 'bg-accent text-accent-foreground',
    };
  }
  if (status === 'PENDING_APPROVAL') {
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

export function CoachSlotList({
  slots,
  deletingId,
  labels,
  onDelete,
}: CoachSlotListProps) {
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
                <p className="text-sm text-muted-foreground">{slot.price}</p>
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
