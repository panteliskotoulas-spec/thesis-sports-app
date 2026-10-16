'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cancelJoinRequest } from '@/lib/teams/team-api';
import type { TeamActionResult } from '@/lib/teams/team';
import { TeamAvatar } from './TeamAvatar';

export interface MyJoinRequestRowLabels {
  pending: string;
  cancel: string;
  askTitle: string;
  confirm: string;
  back: string;
  cancelling: string;
  errorConflict: string;
  errorGeneric: string;
}

export interface MyJoinRequestRowProps {
  requestId: string;
  teamName: string;
  logoUrl: string | null;
  teamHref: string;
  meta: string;
  labels: MyJoinRequestRowLabels;
}

const smallButton =
  'inline-flex h-9 shrink-0 items-center justify-center rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60';

export function MyJoinRequestRow({
  requestId,
  teamName,
  logoUrl,
  teamHref,
  meta,
  labels,
}: MyJoinRequestRowProps) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (busy) return;

    setBusy(true);
    setError(null);

    let result: TeamActionResult;
    try {
      result = await cancelJoinRequest(requestId);
    } catch {
      result = { status: 'error' };
    }

    setBusy(false);

    if (result.status === 'ok') {
      router.refresh();
      return;
    }

    setError(
      result.status === 'conflict' ? labels.errorConflict : labels.errorGeneric,
    );
  }

  return (
    <li className="rounded-xl border-[0.5px] border-border bg-card p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <TeamAvatar name={teamName} logoUrl={logoUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <Link
            href={teamHref}
            className="block truncate text-base text-foreground hover:underline"
          >
            {teamName}
          </Link>
          <p className="truncate text-sm text-muted-foreground">{meta}</p>
        </div>
        <span className="hidden shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground sm:inline">
          {labels.pending}
        </span>
        <button
          type="button"
          aria-expanded={asking}
          onClick={() => {
            setAsking((value) => !value);
            setError(null);
          }}
          className={smallButton}
        >
          {labels.cancel}
        </button>
      </div>

      {asking ? (
        <div className="mt-3 flex flex-col gap-3 border-t-[0.5px] border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground">{labels.askTitle}</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setAsking(false)}
              className={smallButton}
            >
              {labels.back}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleConfirm}
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? labels.cancelling : labels.confirm}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </li>
  );
}
