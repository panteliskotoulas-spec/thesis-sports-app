'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { chipBase, chipOff, chipOn } from '@/components/fields/chipStyles';
import {
  cancelCoachRequest,
  respondCoachRequest,
} from '@/lib/coaches/coach-session-api';
import {
  formatDeadline,
  type CancelCoachRequestResult,
  type CoachRequestItem,
  type CoachRequestState,
} from '@/lib/coaches/coach-session';
import {
  CoachRequestCard,
  type CoachRequestCardLabels,
} from './CoachRequestCard';

export interface CoachRequestsListLabels {
  tabPending: string;
  tabAccepted: string;
  tabRejected: string;
  empty: string;
  acceptedNotice: string;
  rejectedNotice: string;
  cancelledNotice: string;
  errorConflict: string;
  errorGeneric: string;
  card: CoachRequestCardLabels;
}

export interface CoachRequestsListProps {
  lng: string;
  items: CoachRequestItem[];
  labels: CoachRequestsListLabels;
}

export function CoachRequestsList({
  lng,
  items: initialItems,
  labels,
}: CoachRequestsListProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [tab, setTab] = useState<CoachRequestState>('PENDING');
  const [busy, setBusy] = useState<{
    id: string;
    kind: 'accept' | 'reject';
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tabs: { value: CoachRequestState; label: string }[] = [
    { value: 'PENDING', label: labels.tabPending },
    { value: 'ACCEPTED', label: labels.tabAccepted },
    { value: 'REJECTED', label: labels.tabRejected },
  ];

  async function respond(id: string, kind: 'accept' | 'reject') {
    if (busy) return;

    setBusy({ id, kind });
    setError(null);
    setNotice(null);

    const result = await respondCoachRequest(id, kind);

    setBusy(null);

    if (result.status === 'ok') {
      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? kind === 'accept'
              ? {
                  ...item,
                  state: 'ACCEPTED',
                  payment: 'AWAITING',
                  payBy: result.payBy
                    ? formatDeadline(result.payBy, lng)
                    : null,
                }
              : { ...item, state: 'REJECTED', payment: null, payBy: null }
            : item,
        ),
      );
      setNotice(
        kind === 'accept' ? labels.acceptedNotice : labels.rejectedNotice,
      );
      router.refresh();
      return;
    }

    setError(
      result.status === 'conflict' ? labels.errorConflict : labels.errorGeneric,
    );
    if (result.status === 'conflict') router.refresh();
  }

  async function cancel(id: string): Promise<CancelCoachRequestResult> {
    setError(null);
    setNotice(null);

    const result = await cancelCoachRequest(id);

    if (result.status === 'ok') {
      setItems((current) => current.filter((item) => item.id !== id));
      setNotice(labels.cancelledNotice);
      router.refresh();
    } else if (result.status === 'conflict') {
      router.refresh();
    }

    return result;
  }

  const visible = items.filter((item) => item.state === tab);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((entry) => (
          <button
            key={entry.value}
            type="button"
            aria-pressed={tab === entry.value}
            onClick={() => setTab(entry.value)}
            className={`${chipBase} ${tab === entry.value ? chipOn : chipOff}`}
          >
            {entry.label} (
            {items.filter((item) => item.state === entry.value).length})
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

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <div className="rounded-xl border-[0.5px] border-border bg-card p-6 text-center text-muted-foreground">
          {labels.empty}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((item) => (
            <CoachRequestCard
              key={item.id}
              item={item}
              busy={busy?.id === item.id ? busy.kind : null}
              disabled={busy !== null}
              labels={labels.card}
              onAccept={(id) => respond(id, 'accept')}
              onReject={(id) => respond(id, 'reject')}
              onCancel={cancel}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
