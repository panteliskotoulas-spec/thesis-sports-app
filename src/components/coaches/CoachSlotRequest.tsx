'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Info } from 'lucide-react';
import {
  TeamBookingSelect,
  type TeamBookingLabels,
} from '@/components/bookings/TeamBookingSelect';
import { fillTemplate } from '@/lib/bookings/booking';
import { requestCoachSession } from '@/lib/coaches/coach-session-api';
import type { CoachRequestSlotItem } from '@/lib/coaches/coach-session';
import type { TeamBookingOption } from '@/lib/teams/team-booking';

export interface CoachSlotRequestLabels {
  heading: string;
  perSession: string;
  request: string;
  pending: string;
  panelTitle: string;
  priceRow: string;
  payNote: string;
  send: string;
  sending: string;
  cancel: string;
  sent: string;
  errorConflict: string;
  errorGeneric: string;
  team: TeamBookingLabels;
}

export interface CoachSlotRequestProps {
  lng: string;
  slots: CoachRequestSlotItem[];
  teams: TeamBookingOption[];
  loginHref: string | null;
  labels: CoachSlotRequestLabels;
}

const buttonBase =
  'inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60';

export function CoachSlotRequest({
  lng,
  slots,
  teams,
  loginHref,
  labels,
}: CoachSlotRequestProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [requested, setRequested] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selected = slots.find((slot) => slot.id === selectedId) ?? null;

  function close() {
    setSelectedId(null);
    setTeamId(null);
    setError(null);
  }

  async function handleSend() {
    if (!selected || busy) return;

    setBusy(true);
    setError(null);

    const result = await requestCoachSession({
      slotId: selected.id,
      teamId,
      lng,
    });

    setBusy(false);

    if (result === 'ok') {
      setRequested((current) => [...current, selected.id]);
      setNotice(labels.sent);
      close();
      router.refresh();
      return;
    }

    setError(
      result === 'conflict' ? labels.errorConflict : labels.errorGeneric,
    );
    if (result === 'conflict') router.refresh();
  }

  return (
    <div>
      <h3 className="sr-only">{labels.heading}</h3>

      <ul className="flex flex-col gap-2">
        {slots.map((slot) => {
          const isRequested = requested.includes(slot.id);
          const isSelected = slot.id === selectedId;

          return (
            <li
              key={slot.id}
              className={`flex items-center justify-between gap-3 rounded-xl border-[0.5px] bg-card px-3 py-3 ${
                isSelected ? 'border-primary' : 'border-border'
              }`}
            >
              <span className="flex flex-col">
                <span className="font-medium">{slot.time}</span>
                <span className="text-sm text-muted-foreground">
                  {slot.price} {labels.perSession}
                </span>
              </span>

              {isRequested ? (
                <span className="inline-flex shrink-0 items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {labels.pending}
                </span>
              ) : loginHref ? (
                <Link
                  href={loginHref}
                  className={`${buttonBase} shrink-0 bg-primary text-primary-foreground hover:opacity-90`}
                >
                  {labels.request}
                </Link>
              ) : (
                <button
                  type="button"
                  aria-pressed={isSelected}
                  disabled={busy}
                  onClick={() => {
                    setSelectedId(slot.id);
                    setError(null);
                    setNotice(null);
                  }}
                  className={`${buttonBase} shrink-0 bg-primary text-primary-foreground hover:opacity-90`}
                >
                  {labels.request}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {selected ? (
        <div className="mt-4 flex flex-col gap-3 border-t-[0.5px] border-border pt-4">
          <p className="text-sm text-muted-foreground">
            {fillTemplate(labels.panelTitle, { time: selected.time })}
          </p>

          {teams.length > 0 ? (
            <TeamBookingSelect
              teams={teams}
              value={teamId}
              labels={labels.team}
              disabled={busy}
              onChange={setTeamId}
            />
          ) : null}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{labels.priceRow}</span>
            <span className="font-medium">{selected.price}</span>
          </div>

          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {labels.payNote}
          </p>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={handleSend}
              className={`${buttonBase} flex-1 bg-primary text-primary-foreground hover:opacity-90`}
            >
              {busy ? labels.sending : labels.send}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={close}
              className={`${buttonBase} border-[0.5px] border-border bg-card text-foreground hover:bg-secondary`}
            >
              {labels.cancel}
            </button>
          </div>
        </div>
      ) : null}

      {notice ? (
        <div
          role="status"
          className="mt-4 flex items-start gap-2 rounded-xl bg-accent p-3 text-sm text-accent-foreground"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {notice}
        </div>
      ) : null}
    </div>
  );
}
