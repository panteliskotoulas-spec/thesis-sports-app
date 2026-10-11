import Link from 'next/link';
import { fillTemplate, formatAmount } from '@/lib/bookings/booking';
import {
  computeSplitProgress,
  memberInitials,
  type TeamSplitStatus,
  type TeamSplitSummary,
} from '@/lib/teams/team-split';

export interface TeamSplitLabels {
  title: string;
  progress: string;
  collected: string;
  paid: string;
  pending: string;
  leaderNote: string;
  yourShare: string;
  toLeader: string;
  pay: string;
  youPaid: string;
}

export interface TeamSplitProgressProps {
  split: TeamSplitSummary;
  lng: string;
  payHref?: string;
  labels: TeamSplitLabels;
}

const chipBase =
  'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

function StatusChip({
  status,
  labels,
}: {
  status: TeamSplitStatus;
  labels: TeamSplitLabels;
}) {
  return status === 'PAID' ? (
    <span className={`${chipBase} bg-accent text-accent-foreground`}>
      {labels.paid}
    </span>
  ) : (
    <span className={`${chipBase} bg-secondary text-terracotta`}>
      {labels.pending}
    </span>
  );
}

export function TeamSplitProgress({
  split,
  lng,
  payHref,
  labels,
}: TeamSplitProgressProps) {
  if (split.viewer === 'member') {
    const paid = split.myStatus === 'PAID';

    return (
      <div className="mt-3 border-t-[0.5px] border-border pt-3">
        <div className="rounded-xl bg-secondary p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">
              {fillTemplate(labels.yourShare, {
                amount: formatAmount(split.share, lng),
              })}
            </p>
            {paid ? <StatusChip status="PAID" labels={labels} /> : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {fillTemplate(labels.toLeader, { name: split.leaderName })}
          </p>
          {paid ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {labels.youPaid}
            </p>
          ) : payHref ? (
            <Link
              href={payHref}
              className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              {labels.pay}
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  const progress = computeSplitProgress(split.members);

  return (
    <div className="mt-3 border-t-[0.5px] border-border pt-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium">{labels.title}</h3>
        <p className="text-xs text-muted-foreground">
          {fillTemplate(labels.progress, {
            paid: String(progress.paidCount),
            total: String(split.members.length),
          })}
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
        className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {fillTemplate(labels.collected, {
          collected: formatAmount(progress.collected, lng),
          owed: formatAmount(progress.owed, lng),
        })}
      </p>

      <ul className="mt-2 flex flex-col">
        {split.members.map((member) => (
          <li
            key={member.userId}
            className="flex items-center gap-3 border-t-[0.5px] border-border py-2"
          >
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-accent-foreground"
            >
              {memberInitials(member.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{member.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatAmount(member.amount, lng)}
              </p>
            </div>
            <StatusChip status={member.status} labels={labels} />
          </li>
        ))}
      </ul>

      <p className="mt-2 text-xs text-muted-foreground">
        {fillTemplate(labels.leaderNote, {
          total: formatAmount(split.total, lng),
          share: formatAmount(split.share, lng),
        })}
      </p>
    </div>
  );
}
