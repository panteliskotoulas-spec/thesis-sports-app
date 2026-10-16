'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cancelTeamRequest } from '@/lib/tournaments/team-request-api';

export interface MyTournamentRowEntry {
  key: string;
  text: string;
  pending: boolean;
  requestId: string | null;
  canCancel: boolean;
}

export interface MyTournamentRowLabels {
  cancel: string;
  ask: string;
  confirm: string;
  back: string;
  cancelling: string;
  errorConflict: string;
  errorGeneric: string;
}

export interface MyTournamentRowProps {
  name: string;
  href: string;
  meta: string;
  entries: MyTournamentRowEntry[];
  labels: MyTournamentRowLabels;
}

const smallButton =
  'inline-flex h-8 shrink-0 items-center justify-center rounded-full border-[0.5px] border-border bg-card px-3.5 text-sm font-medium text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60';

export function MyTournamentRow({
  name,
  href,
  meta,
  entries,
  labels,
}: MyTournamentRowProps) {
  const router = useRouter();
  const [askingId, setAskingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(requestId: string) {
    if (busy) return;

    setBusy(true);
    setError(null);

    const result = await cancelTeamRequest(requestId);

    setBusy(false);

    if (result.ok) {
      setAskingId(null);
      router.refresh();
      return;
    }

    setError(
      result.code === 'CONFLICT' ? labels.errorConflict : labels.errorGeneric,
    );
  }

  return (
    <li className="rounded-xl border-[0.5px] border-border bg-card p-3 sm:p-4">
      <Link
        href={href}
        className="block truncate text-base text-foreground hover:underline"
      >
        {name}
      </Link>
      <p className="truncate text-sm text-muted-foreground">{meta}</p>

      <ul className="mt-3 flex flex-col gap-2">
        {entries.map((entry) => {
          const asking =
            entry.requestId !== null && askingId === entry.requestId;

          return (
            <li key={entry.key} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    entry.pending
                      ? 'bg-terracotta/15 text-terracotta'
                      : 'bg-accent text-accent-foreground'
                  }`}
                >
                  {entry.text}
                </span>
                {entry.pending && entry.canCancel && entry.requestId ? (
                  <button
                    type="button"
                    aria-expanded={asking}
                    onClick={() => {
                      setAskingId(asking ? null : entry.requestId);
                      setError(null);
                    }}
                    className={smallButton}
                  >
                    {labels.cancel}
                  </button>
                ) : null}
              </div>

              {asking && entry.requestId ? (
                <div className="flex flex-col gap-3 border-t-[0.5px] border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-foreground">{labels.ask}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setAskingId(null)}
                      className={smallButton}
                    >
                      {labels.back}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleConfirm(entry.requestId as string)}
                      className="inline-flex h-8 shrink-0 items-center justify-center rounded-full bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy ? labels.cancelling : labels.confirm}
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </li>
  );
}
