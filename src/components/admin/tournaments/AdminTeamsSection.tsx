'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Plus, X } from 'lucide-react';
import { fillTemplate } from '@/lib/bookings/booking';
import {
  errorLabel,
  type AdminErrorLabels,
  type TeamOption,
} from '@/lib/tournaments/admin';
import {
  addTournamentTeam,
  removeTournamentTeam,
  type AdminActionResult,
} from '@/lib/tournaments/admin-api';

export interface AdminTeamsSectionLabels {
  title: string;
  count: string;
  empty: string;
  lockedNote: string;
  fullNote: string;
  addLabel: string;
  addPlaceholder: string;
  noOptions: string;
  add: string;
  adding: string;
  pickFirst: string;
  removeAria: string;
  errors: AdminErrorLabels;
}

export interface AdminTeamsSectionProps {
  tournamentId: string;
  teams: { id: string; name: string }[];
  options: TeamOption[];
  locked: boolean;
  full: boolean;
  labels: AdminTeamsSectionLabels;
}

const selectClass =
  'h-11 min-w-0 flex-1 rounded-md border-[0.5px] border-input bg-background px-4 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60';

export function AdminTeamsSection({
  tournamentId,
  teams,
  options,
  locked,
  full,
  labels,
}: AdminTeamsSectionProps) {
  const router = useRouter();
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(key: string, action: () => Promise<AdminActionResult>) {
    if (busy) return;
    setBusy(key);
    setError(null);

    const result = await action();

    if (!result.ok) {
      setError(errorLabel(labels.errors, result.code));
      setBusy(null);
      if (result.code === 'CONFLICT') router.refresh();
      return;
    }

    setSelected('');
    setBusy(null);
    router.refresh();
  }

  function handleAdd() {
    if (!selected) {
      setError(labels.pickFirst);
      return;
    }
    void run('add', () => addTournamentTeam(tournamentId, selected));
  }

  return (
    <section
      aria-labelledby="admin-teams-title"
      className="rounded-xl border-[0.5px] border-border bg-card p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="admin-teams-title" className="text-lg">
          {labels.title}
        </h2>
        <p className="text-sm text-muted-foreground">{labels.count}</p>
      </div>

      {teams.length === 0 ? (
        <p className="mt-3 text-muted-foreground">{labels.empty}</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {teams.map((team) => (
            <li
              key={team.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary py-1 pl-3.5 pr-3.5 text-sm text-secondary-foreground"
            >
              <span>{team.name}</span>
              {locked ? null : (
                <button
                  type="button"
                  aria-label={fillTemplate(labels.removeAria, {
                    name: team.name,
                  })}
                  aria-busy={busy === team.id}
                  onClick={() =>
                    void run(team.id, () =>
                      removeTournamentTeam(tournamentId, team.id),
                    )
                  }
                  className="-mr-2 inline-flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-card hover:text-destructive aria-busy:opacity-50"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {locked ? (
        <p className="mt-4 flex items-start gap-1.5 text-sm text-muted-foreground">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {labels.lockedNote}
        </p>
      ) : full ? (
        <p className="mt-4 text-sm text-muted-foreground">{labels.fullNote}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-1.5">
          <label htmlFor="admin-team-select">{labels.addLabel}</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              id="admin-team-select"
              value={selected}
              disabled={options.length === 0}
              onChange={(event) => {
                setSelected(event.target.value);
                setError(null);
              }}
              className={selectClass}
            >
              <option value="">
                {options.length === 0
                  ? labels.noOptions
                  : labels.addPlaceholder}
              </option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-busy={busy === 'add'}
              onClick={handleAdd}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 aria-busy:cursor-not-allowed aria-busy:opacity-60"
            >
              <Plus className="size-4" aria-hidden="true" />
              {busy === 'add' ? labels.adding : labels.add}
            </button>
          </div>
        </div>
      )}

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
