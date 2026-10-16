'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { errorLabel, type AdminErrorLabels } from '@/lib/tournaments/admin';
import { removeTournament } from '@/lib/tournaments/admin-api';

export interface DeleteTournamentButtonLabels {
  delete: string;
  confirm: string;
  yes: string;
  no: string;
  working: string;
  errors: AdminErrorLabels;
}

export interface DeleteTournamentButtonProps {
  lng: string;
  tournamentId: string;
  labels: DeleteTournamentButtonLabels;
}

const buttonBase =
  'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium';

export function DeleteTournamentButton({
  lng,
  tournamentId,
  labels,
}: DeleteTournamentButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (busy) return;
    setBusy(true);
    setError(null);

    const result = await removeTournament(tournamentId);

    if (!result.ok) {
      setError(errorLabel(labels.errors, result.code));
      setBusy(false);
      if (result.code === 'CONFLICT') router.refresh();
      return;
    }

    router.push(`/${lng}/admin/tournaments`);
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={`${buttonBase} border-[0.5px] border-border bg-card text-destructive hover:bg-secondary`}
      >
        <Trash2 className="size-4" aria-hidden="true" />
        {labels.delete}
      </button>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-label={labels.delete}
      className="flex w-full flex-col gap-3 rounded-lg border-[0.5px] border-destructive/40 bg-card p-3"
    >
      <p className="text-sm">{labels.confirm}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          className={`${buttonBase} border-[0.5px] border-border bg-card text-foreground hover:bg-secondary`}
        >
          {labels.no}
        </button>
        <button
          type="button"
          aria-busy={busy}
          onClick={() => void handleDelete()}
          className={`${buttonBase} bg-destructive text-destructive-foreground hover:opacity-90 aria-busy:cursor-not-allowed aria-busy:opacity-60`}
        >
          {busy ? labels.working : labels.yes}
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
