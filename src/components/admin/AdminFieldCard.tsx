'use client';

import { useId, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronDown,
  Clock,
  ExternalLink,
  Home,
  ImageIcon,
  MapPin,
  Sun,
  User,
} from 'lucide-react';
import {
  REJECTION_REASON_MAX,
  type FieldStatusValue,
} from '@/lib/fields/approval';
import {
  approveField,
  rejectField,
  type ApprovalResult,
} from '@/lib/fields/approval-api';

export interface AdminFieldCardData {
  id: string;
  name: string;
  area: string;
  description: string;
  address: string;
  mapsUrl: string;
  indoor: boolean;
  sports: { value: string; label: string }[];
  ownerLine: string;
  submitted: string;
  photosCount: string;
  images: string[];
  status: FieldStatusValue;
  rejectionReason: string | null;
}

export interface AdminFieldCardLabels {
  indoor: string;
  outdoor: string;
  badgeApproved: string;
  badgeRejected: string;
  details: string;
  description: string;
  address: string;
  openMaps: string;
  photosTitle: string;
  noPhotos: string;
  photo: string;
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

export interface AdminFieldCardProps {
  lng: string;
  field: AdminFieldCardData;
  labels: AdminFieldCardLabels;
}

const buttonBase =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60';
const primaryButton = `${buttonBase} flex-1 bg-primary text-primary-foreground hover:opacity-90`;
const outlineButton = `${buttonBase} flex-1 border-[0.5px] border-border bg-card text-foreground hover:bg-secondary`;
const dangerOutlineButton = `${buttonBase} flex-1 border-[0.5px] border-border bg-card text-destructive hover:bg-secondary`;
const dangerButton = `${buttonBase} flex-[2] bg-destructive text-destructive-foreground hover:opacity-90`;

export function AdminFieldCard({ lng, field, labels }: AdminFieldCardProps) {
  const router = useRouter();
  const detailsId = useId();
  const reasonId = useId();

  const [open, setOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cover = field.images[0] ?? null;

  async function run(
    kind: 'approve' | 'reject',
    action: () => Promise<ApprovalResult>,
  ) {
    setBusy(kind);
    setError(null);

    const result = await action();

    if (result === 'error') {
      setError(labels.errorGeneric);
      setBusy(null);
      return;
    }

    router.refresh();
  }

  return (
    <article className="min-w-0 rounded-xl border-[0.5px] border-border bg-card p-4">
      <div className="flex gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-accent sm:size-22">
          {cover ? (
            <Image
              src={cover}
              alt=""
              fill
              sizes="88px"
              className="object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-accent-foreground">
              <ImageIcon className="size-6" aria-hidden="true" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 wrap-break-word">{field.name}</h3>
            {field.status === 'APPROVED' ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                <Check className="size-3.5" aria-hidden="true" />
                {labels.badgeApproved}
              </span>
            ) : null}
            {field.status === 'REJECTED' ? (
              <span className="inline-flex shrink-0 items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-destructive">
                {labels.badgeRejected}
              </span>
            ) : null}
          </div>

          <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 wrap-break-word">{field.area}</span>
          </p>

          <ul className="mt-2 flex flex-wrap gap-1.5">
            <li className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
              {field.indoor ? (
                <Home className="size-3.5" aria-hidden="true" />
              ) : (
                <Sun className="size-3.5" aria-hidden="true" />
              )}
              {field.indoor ? labels.indoor : labels.outdoor}
            </li>
            {field.sports.map((sport) => (
              <li
                key={sport.value}
                className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
              >
                {sport.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <User className="size-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 wrap-break-word ">{field.ownerLine}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <Clock className="size-4 shrink-0" aria-hidden="true" />
          {field.submitted} · {field.photosCount}
        </p>
      </div>

      {field.status === 'REJECTED' && field.rejectionReason ? (
        <div className="mt-3 rounded-xl bg-secondary px-3 py-2">
          <h4 className="text-xs font-medium text-muted-foreground">
            {labels.rejectedReason}
          </h4>
          <p className="mt-0.5 whitespace-pre-line text-foreground">
            {field.rejectionReason}
          </p>
        </div>
      ) : null}

      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((previous) => !previous)}
        className="mt-3 flex w-full items-center justify-between border-t-[0.5px] border-border pt-3 text-sm font-medium text-foreground"
      >
        {labels.details}
        <ChevronDown
          className={`size-5 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div id={detailsId} className="mt-3 flex flex-col gap-4">
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {labels.description}
            </h4>
            <p className="mt-1 whitespace-pre-line text-foreground">
              {field.description}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {labels.address}
            </h4>
            <p className="mt-1 flex items-center gap-1.5 text-foreground">
              <MapPin
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              {field.address}
            </p>
            <a
              href={field.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex h-10 items-center gap-1.5 rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary"
            >
              {labels.openMaps}
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </div>

          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {labels.photosTitle}
            </h4>
            {field.images.length > 0 ? (
              <ul className="mt-1.5 grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                {field.images.map((url, index) => (
                  <li
                    key={url}
                    className="relative aspect-square overflow-hidden rounded-lg bg-secondary"
                  >
                    <Image
                      src={url}
                      alt={`${labels.photo} ${index + 1}`}
                      fill
                      sizes="(min-width: 640px) 80px, 25vw"
                      className="object-cover"
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-muted-foreground">{labels.noPhotos}</p>
            )}
          </div>
        </div>
      ) : null}

      {field.status === 'PENDING' ? (
        rejecting ? (
          <div className="mt-4 border-t-[0.5px] border-border pt-4">
            <label htmlFor={reasonId}>{labels.reasonLabel}</label>
            <textarea
              id={reasonId}
              value={reason}
              rows={3}
              maxLength={REJECTION_REASON_MAX}
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
                  run('reject', () => rejectField(field.id, reason, lng))
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
              onClick={() => run('approve', () => approveField(field.id))}
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
