'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { TeamAvatar } from '@/components/teams/TeamAvatar';
import { fillTemplate } from '@/lib/bookings/booking';
import { errorLabel, type AdminErrorLabels } from '@/lib/tournaments/admin';
import type { AdminActionResult } from '@/lib/tournaments/admin-api';
import type { AdminRequestRow } from '@/lib/tournaments/team-request';
import {
  acceptTeamRequest,
  rejectTeamRequest,
} from '@/lib/tournaments/team-request-api';

export interface AdminRequestsSectionLabels {
  title: string;
  empty: string;
  accept: string;
  accepting: string;
  reject: string;
  rejecting: string;
  rejectConfirm: string;
  rejectYes: string;
  rejectNo: string;
  acceptAria: string;
  rejectAria: string;
  lockedNote: string;
  fullNote: string;
  pendingCount: string;
  errors: AdminErrorLabels;
}

export interface AdminRequestsSectionProps {
  requests: AdminRequestRow[];
  locked: boolean;
  full: boolean;
  labels: AdminRequestsSectionLabels;
}

const buttonBase =
  'inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60';
const acceptButton = `${buttonBase} bg-primary text-primary-foreground hover:opacity-90`;
const rejectButton = `${buttonBase} border-[0.5px] border-terracotta bg-card text-terracotta hover:bg-terracotta/10`;
const neutralButton = `${buttonBase} border-[0.5px] border-border bg-card text-foreground hover:bg-secondary`;

export function AdminRequestsSection({
  requests,
  locked,
  full,
  labels,
}: AdminRequestsSectionProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const acceptLocked = locked || full;

  async function run(key: string, action: () => Promise<AdminActionResult>) {
    if (busy) return;

    setBusy(key);
    setError(null);

    const result = await action();

    if (!result.ok) {
      setError(errorLabel(labels.errors, result.code));
      setBusy(null);
      if (result.code === 'CONFLICT' || result.code === 'NOT_FOUND') {
        router.refresh();
      }
      return;
    }

    setConfirming(null);
    setBusy(null);
    router.refresh();
  }

  return (
    <section
      aria-labelledby="admin-requests-title"
      className="rounded-xl border-[0.5px] border-border bg-card p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="admin-requests-title" className="text-lg">
          {labels.title}
        </h2>
        {requests.length > 0 ? (
          <span className="rounded-full bg-terracotta/15 px-2.5 py-0.5 text-xs font-medium text-terracotta">
            {fillTemplate(labels.pendingCount, { n: String(requests.length) })}
          </span>
        ) : null}
      </div>

      {requests.length === 0 ? (
        <p className="mt-3 text-muted-foreground">{labels.empty}</p>
      ) : (
        <ul className="mt-3 flex flex-col">
          {requests.map((request) => {
            const rowBusy =
              busy === `accept-${request.id}` ||
              busy === `reject-${request.id}`;
            const isConfirming = confirming === request.id;

            return (
              <li
                key={request.id}
                className="flex flex-col gap-3 border-t-[0.5px] border-border py-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <TeamAvatar
                    name={request.teamName}
                    logoUrl={request.teamLogoUrl}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="wrap-break-word font-medium">
                      {request.teamName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {request.metaText}
                    </p>
                  </div>
                </div>

                {isConfirming ? (
                  <div className="flex flex-col gap-2 sm:items-end">
                    <p className="text-sm text-muted-foreground">
                      {labels.rejectConfirm}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-busy={busy === `reject-${request.id}`}
                        disabled={rowBusy}
                        onClick={() =>
                          void run(`reject-${request.id}`, () =>
                            rejectTeamRequest(request.id),
                          )
                        }
                        className={rejectButton}
                      >
                        {busy === `reject-${request.id}`
                          ? labels.rejecting
                          : labels.rejectYes}
                      </button>
                      <button
                        type="button"
                        disabled={rowBusy}
                        onClick={() => setConfirming(null)}
                        className={neutralButton}
                      >
                        {labels.rejectNo}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      aria-label={fillTemplate(labels.rejectAria, {
                        name: request.teamName,
                      })}
                      disabled={busy !== null}
                      onClick={() => {
                        setError(null);
                        setConfirming(request.id);
                      }}
                      className={rejectButton}
                    >
                      {labels.reject}
                    </button>
                    <button
                      type="button"
                      aria-label={fillTemplate(labels.acceptAria, {
                        name: request.teamName,
                      })}
                      aria-busy={busy === `accept-${request.id}`}
                      disabled={acceptLocked || busy !== null}
                      onClick={() =>
                        void run(`accept-${request.id}`, () =>
                          acceptTeamRequest(request.id),
                        )
                      }
                      className={acceptButton}
                    >
                      {busy === `accept-${request.id}`
                        ? labels.accepting
                        : labels.accept}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {requests.length > 0 && acceptLocked ? (
        <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {locked ? labels.lockedNote : labels.fullNote}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
