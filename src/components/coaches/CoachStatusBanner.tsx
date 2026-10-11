import { Check, Clock, X } from 'lucide-react';
import type { CoachStatusValue } from '@/lib/coaches/coach';

export interface CoachStatusBannerLabels {
  title: string;
  description: string;
  reason: string;
}

export interface CoachStatusBannerProps {
  status: CoachStatusValue;
  rejectionReason: string | null;
  labels: CoachStatusBannerLabels;
}

export function CoachStatusBanner({
  status,
  rejectionReason,
  labels,
}: CoachStatusBannerProps) {
  const rejected = status === 'REJECTED';

  return (
    <div
      role="status"
      className={`flex gap-3 rounded-xl p-4 ${
        rejected
          ? 'bg-secondary text-foreground'
          : 'bg-accent text-accent-foreground'
      }`}
    >
      <span className="mt-0.5 shrink-0">
        {status === 'PENDING' ? (
          <Clock className="size-5" aria-hidden="true" />
        ) : null}
        {status === 'APPROVED' ? (
          <Check className="size-5" aria-hidden="true" />
        ) : null}
        {rejected ? (
          <X className="size-5 text-destructive" aria-hidden="true" />
        ) : null}
      </span>
      <div className="min-w-0">
        <h2 className="text-base">{labels.title}</h2>
        <p className="mt-0.5 text-sm">{labels.description}</p>
        {rejected && rejectionReason ? (
          <div className="mt-2">
            <h3 className="text-xs font-medium text-muted-foreground">
              {labels.reason}
            </h3>
            <p className="mt-0.5 whitespace-pre-line text-sm text-foreground">
              {rejectionReason}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
