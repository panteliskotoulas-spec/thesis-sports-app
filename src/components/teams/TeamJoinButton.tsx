'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, Settings } from 'lucide-react';
import {
  cancelJoinRequest,
  leaveTeam,
  requestToJoin,
} from '@/lib/teams/team-api';
import type { TeamActionResult, TeamViewerState } from '@/lib/teams/team';

export interface TeamJoinLabels {
  login: string;
  join: string;
  joining: string;
  cancelRequest: string;
  cancelling: string;
  leave: string;
  leaveTitle: string;
  leaveBody: string;
  leaveConfirm: string;
  leaveBack: string;
  leaving: string;
  manage: string;
  full: string;
  sportTaken: string;
  errorConflict: string;
  errorGeneric: string;
}

export interface TeamJoinButtonProps {
  teamId: string;
  lng: string;
  viewer: TeamViewerState;
  labels: TeamJoinLabels;
  statsNote: string | null;
}

const base =
  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-medium';
const primary = `${base} bg-primary text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60`;
const outline = `${base} border-[0.5px] border-border bg-card text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60`;
const quiet = `${base} bg-secondary text-muted-foreground`;

export function TeamJoinButton({
  teamId,
  lng,
  viewer,
  labels,
  statsNote,
}: TeamJoinButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);

  async function run(action: () => Promise<TeamActionResult>) {
    if (busy) return;

    setBusy(true);
    setError(null);

    let result: TeamActionResult;
    try {
      result = await action();
    } catch {
      result = { status: 'error' };
    }

    setBusy(false);

    if (result.status === 'ok') {
      setLeaveOpen(false);
      router.refresh();
      return;
    }

    setError(
      result.status === 'conflict' ? labels.errorConflict : labels.errorGeneric,
    );
  }

  function renderAction() {
    switch (viewer.kind) {
      case 'guest':
        return (
          <Link href={`/${lng}/login`} className={primary}>
            {labels.login}
          </Link>
        );
      case 'leader':
        return (
          <Link href={`/${lng}/teams/${teamId}/manage`} className={primary}>
            <Settings className="size-4" aria-hidden="true" />
            {labels.manage}
          </Link>
        );
      case 'member':
        return (
          <button
            type="button"
            aria-expanded={leaveOpen}
            onClick={() => setLeaveOpen((open) => !open)}
            className={`${outline} text-destructive`}
          >
            {labels.leave}
          </button>
        );
      case 'pending': {
        const { requestId } = viewer;
        return (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => cancelJoinRequest(requestId))}
            className={outline}
          >
            <Clock className="size-4" aria-hidden="true" />
            {busy ? labels.cancelling : labels.cancelRequest}
          </button>
        );
      }
      case 'sportTaken':
        return <p className={quiet}>{labels.sportTaken}</p>;
      case 'full':
        return <p className={quiet}>{labels.full}</p>;
      case 'open':
        return (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => requestToJoin(teamId))}
            className={primary}
          >
            {busy ? labels.joining : labels.join}
          </button>
        );
    }
  }

  return (
    <div className="flex w-full flex-col gap-3 sm:w-64">
      {renderAction()}

      {viewer.kind === 'open' && statsNote ? (
        <p className="text-center text-xs text-muted-foreground">{statsNote}</p>
      ) : null}

      {viewer.kind === 'member' && leaveOpen ? (
        <div className="rounded-xl border-[0.5px] border-border bg-card p-3">
          <p className="font-medium text-foreground">{labels.leaveTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.leaveBody}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setLeaveOpen(false)}
              className="h-11 rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-60"
            >
              {labels.leaveBack}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => leaveTeam(teamId))}
              className="h-11 rounded-full bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-60"
            >
              {busy ? labels.leaving : labels.leaveConfirm}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
