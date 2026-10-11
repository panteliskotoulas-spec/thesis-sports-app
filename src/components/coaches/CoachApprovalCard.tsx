'use client';

import { useId, useState } from 'react';
import { Award, Check, Clock, Mail } from 'lucide-react';
import {
  COACH_REJECTION_REASON_MAX,
  type CoachApprovalCardData,
  type CoachApprovalResult,
  type CoachStatusValue,
} from '@/lib/coaches/coach';
import { mockApproveCoach, mockRejectCoach } from '@/lib/coaches/coach-mock';

export interface CoachApprovalCardLabels {
  badgeApproved: string;
  badgeRejected: string;
  approve: string;
  reject: string;
  confirmReject: string;
  cancel: string;
  reasonLabel: string;
  reasonPlaceholder: string;
  reasonHint: string;
  rejectedReason: string;
  working: string;
  errorGeneric: string;
}

export interface CoachApprovalCardProps {
  coach: CoachApprovalCardData;
  labels: CoachApprovalCardLabels;
}

const buttonBase =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60';
const primaryButton = `${buttonBase} flex-1 bg-primary text-primary-foreground hover:opacity-90`;
const outlineButton = `${buttonBase} flex-1 border-[0.5px] border-border bg-card text-foreground hover:bg-secondary`;
const dangerOutlineButton = `${buttonBase} flex-1 border-[0.5px] border-border bg-card text-destructive hover:bg-secondary`;
const dangerButton = `${buttonBase} flex-[2] bg-destructive text-destructive-foreground hover:opacity-90`;

export function CoachApprovalCard({ coach, labels }: CoachApprovalCardProps) {
  const reasonId = useId();

  const [status, setStatus] = useState<CoachStatusValue>(coach.status);
  const [rejectionReason, setRejectionReason] = useState(coach.rejectionReason);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(
    kind: 'approve' | 'reject',
    action: () => Promise<CoachApprovalResult>,
    next: CoachStatusValue,
  ) {
    setBusy(kind);
    setError(null);

    const result = await action();

    if (result === 'error') {
      setError(labels.errorGeneric);
      setBusy(null);
      return;
    }

    setStatus(next);
    setRejectionReason(kind === 'reject' ? reason.trim() || null : null);
    setRejecting(false);
    setBusy(null);
  }

  return (
    <article className="min-w-0 rounded-xl border-[0.5px] border-border bg-card p-4">
      <div className="flex gap-3">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground"
        >
          {coach.initials}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 wrap-break-word">{coach.name}</h3>
            {status === 'APPROVED' ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                <Check className="size-3.5" aria-hidden="true" />
                {labels.badgeApproved}
              </span>
            ) : null}
            {status === 'REJECTED' ? (
              <span className="inline-flex shrink-0 items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-destructive">
                {labels.badgeRejected}
              </span>
            ) : null}
          </div>

          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Mail className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 wrap-break-word">{coach.email}</span>
          </p>

          <ul className="mt-2 flex flex-wrap gap-1.5">
            <li className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
              {coach.sport.label}
            </li>
            <li className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
              {coach.rate}
            </li>
          </ul>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-line text-foreground">{coach.bio}</p>

      <div className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground">
        {coach.certifications ? (
          <p className="flex items-center gap-1.5">
            <Award className="size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 wrap-break-word">
              {coach.certifications}
            </span>
          </p>
        ) : null}
        <p className="flex items-center gap-1.5">
          <Clock className="size-4 shrink-0" aria-hidden="true" />
          {coach.submitted}
        </p>
      </div>

      {status === 'REJECTED' && rejectionReason ? (
        <div className="mt-3 rounded-xl bg-secondary px-3 py-2">
          <h4 className="text-xs font-medium text-muted-foreground">
            {labels.rejectedReason}
          </h4>
          <p className="mt-0.5 whitespace-pre-line text-foreground">
            {rejectionReason}
          </p>
        </div>
      ) : null}

      {status === 'PENDING' ? (
        rejecting ? (
          <div className="mt-4 border-t-[0.5px] border-border pt-4">
            <label htmlFor={reasonId}>{labels.reasonLabel}</label>
            <textarea
              id={reasonId}
              value={reason}
              rows={3}
              maxLength={COACH_REJECTION_REASON_MAX}
              placeholder={labels.reasonPlaceholder}
              onChange={(event) => setReason(event.target.value)}
              className="mt-1.5 w-full resize-none rounded-xl border-[0.5px] border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {labels.reasonHint}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() =>
                  run(
                    'reject',
                    () => mockRejectCoach(coach.id, reason),
                    'REJECTED',
                  )
                }
                className={dangerButton}
              >
                {busy === 'reject' ? labels.working : labels.confirmReject}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => {
                  setRejecting(false);
                  setReason('');
                  setError(null);
                }}
                className={outlineButton}
              >
                {labels.cancel}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() =>
                run('approve', () => mockApproveCoach(coach.id), 'APPROVED')
              }
              className={primaryButton}
            >
              {busy === 'approve' ? (
                labels.working
              ) : (
                <>
                  <Check className="size-4" aria-hidden="true" />
                  {labels.approve}
                </>
              )}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => setRejecting(true)}
              className={dangerOutlineButton}
            >
              {labels.reject}
            </button>
          </div>
        )
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </article>
  );
}
