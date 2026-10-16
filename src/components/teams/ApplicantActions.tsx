'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { respondToJoinRequest } from '@/lib/teams/team-api';
import type { TeamActionResult } from '@/lib/teams/team';

export interface ApplicantActionsLabels {
  accept: string;
  reject: string;
  full: string;
  errorConflict: string;
  errorGeneric: string;
}

type Decision = 'ACCEPT' | 'REJECT';

const button =
  'inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-6 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60';

export function ApplicantActions({
  requestId,
  backHref,
  full,
  labels,
}: {
  requestId: string;
  backHref: string;
  full: boolean;
  labels: ApplicantActionsLabels;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(decision: Decision) {
    if (busy) return;

    setBusy(decision);
    setError(null);

    let result: TeamActionResult;
    try {
      result = await respondToJoinRequest(requestId, decision);
    } catch {
      result = { status: 'error' };
    }

    if (result.status === 'ok') {
      router.push(backHref);
      router.refresh();
      return;
    }

    setBusy(null);
    setError(
      result.status === 'conflict' ? labels.errorConflict : labels.errorGeneric,
    );
  }

  return (
    <div>
      {full ? (
        <p className="mb-3 rounded-xl bg-secondary px-3 py-2 text-sm text-muted-foreground">
          {labels.full}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={full || busy !== null}
          onClick={() => respond('ACCEPT')}
          className={`${button} bg-primary text-primary-foreground hover:opacity-90`}
        >
          <Check className="size-4" aria-hidden="true" />
          {labels.accept}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => respond('REJECT')}
          className={`${button} border-[0.5px] border-border bg-card text-foreground hover:bg-secondary`}
        >
          <X className="size-4" aria-hidden="true" />
          {labels.reject}
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
