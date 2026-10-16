'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminActionResult } from '@/lib/tournaments/admin-api';
import {
  applyToTournament,
  cancelTeamRequest,
} from '@/lib/tournaments/team-request-api';
import type { VisibleTeamRequestViewer } from '@/lib/tournaments/team-request';

export interface TeamRequestCardLabels {
  title: string;
  teamLabel: string;
  apply: string;
  applying: string;
  openNote: string;
  fullNote: string;
  pendingBadge: string;
  cancel: string;
  cancelling: string;
  rejectedBadge: string;
  rejectedNote: string;
  errorConflict: string;
  errorGeneric: string;
}

export interface TeamRequestCardProps {
  tournamentId: string;
  viewer: VisibleTeamRequestViewer;
  sentText: string | null;
  labels: TeamRequestCardLabels;
}

const buttonBase =
  'inline-flex h-11 w-full items-center justify-center rounded-full px-6 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60';
const primaryButton = `${buttonBase} bg-primary text-primary-foreground hover:opacity-90`;
const outlineButton = `${buttonBase} border-[0.5px] border-border bg-card text-foreground hover:bg-secondary`;

function teamNameOf(viewer: VisibleTeamRequestViewer): string {
  return viewer.kind === 'open' ? viewer.team.name : viewer.teamName;
}

export function TeamRequestCard({
  tournamentId,
  viewer,
  sentText,
  labels,
}: TeamRequestCardProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<AdminActionResult>) {
    if (busy) return;

    setBusy(true);
    setError(null);

    const result = await action();

    setBusy(false);

    if (result.ok) {
      router.refresh();
      return;
    }

    if (result.code === 'CONFLICT') {
      setError(labels.errorConflict);
      router.refresh();
      return;
    }

    setError(labels.errorGeneric);
  }

  return (
    <section
      aria-labelledby="team-request-title"
      className="rounded-xl border-[0.5px] border-border bg-card p-4 sm:p-6"
    >
      <h2 id="team-request-title" className="text-lg">
        {labels.title}
      </h2>

      {viewer.kind === 'open' ? (
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{labels.teamLabel}</p>
            <p className="mt-1 rounded-md border-[0.5px] border-input bg-background px-4 py-2.5 wrap-break-word text-foreground">
              {viewer.team.name}
            </p>
          </div>
          <button
            type="button"
            aria-busy={busy}
            disabled={busy}
            onClick={() =>
              void run(() => applyToTournament(tournamentId, viewer.team.id))
            }
            className={primaryButton}
          >
            {busy ? labels.applying : labels.apply}
          </button>
          <p className="text-sm text-muted-foreground">{labels.openNote}</p>
        </div>
      ) : null}

      {viewer.kind === 'full' ? (
        <div className="mt-3 flex flex-col gap-2">
          <p className="wrap-break-word text-sm text-muted-foreground">
            {teamNameOf(viewer)}
          </p>
          <p className="text-sm text-muted-foreground">{labels.fullNote}</p>
        </div>
      ) : null}

      {viewer.kind === 'pending' ? (
        <div className="mt-3 flex flex-col gap-3">
          <p className="wrap-break-word text-sm text-muted-foreground">
            {viewer.teamName}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-sage px-2.5 py-0.5 text-xs font-medium text-foreground">
              {labels.pendingBadge}
            </span>
            {sentText ? <p className="text-sm">{sentText}</p> : null}
          </div>
          <button
            type="button"
            aria-busy={busy}
            disabled={busy}
            onClick={() => void run(() => cancelTeamRequest(viewer.requestId))}
            className={outlineButton}
          >
            {busy ? labels.cancelling : labels.cancel}
          </button>
        </div>
      ) : null}

      {viewer.kind === 'rejected' ? (
        <div className="mt-3 flex flex-col gap-2">
          <p className="wrap-break-word text-sm text-muted-foreground">
            {viewer.teamName}
          </p>
          <div>
            <span className="rounded-full bg-terracotta/15 px-2.5 py-0.5 text-xs font-medium text-terracotta">
              {labels.rejectedBadge}
            </span>
          </div>
          <p className="text-sm">{labels.rejectedNote}</p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
