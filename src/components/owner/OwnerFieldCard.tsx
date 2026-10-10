'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Archive, Clock, Home, ImageIcon, MapPin, Sun } from 'lucide-react';
import { archiveField } from '@/lib/fields/owner-api';
import type { OwnerFieldItem } from '@/lib/fields/owner';

export interface OwnerFieldCardLabels {
  indoor: string;
  outdoor: string;
  badgeApproved: string;
  badgePending: string;
  badgeRejected: string;
  badgeArchived: string;
  pendingNote: string;
  archivedNote: string;
  rejectedReason: string;
  view: string;
  availability: string;
  edit: string;
  resubmit: string;
  archive: string;
  confirmTitle: string;
  confirmBody: string;
  confirmAction: string;
  cancel: string;
  working: string;
  blockedTitle: string;
  blockedOne: string;
  blockedOther: string;
  ok: string;
  errorGeneric: string;
}

export interface OwnerFieldCardProps {
  lng: string;
  field: OwnerFieldItem;
  sports: { value: string; label: string }[];
  labels: OwnerFieldCardLabels;
}

type Panel = 'idle' | 'confirm' | 'blocked';

const buttonBase =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60';
const primaryButton = `${buttonBase} flex-1 bg-primary text-primary-foreground hover:opacity-90`;
const outlineButton = `${buttonBase} flex-1 border-[0.5px] border-border bg-card text-foreground hover:bg-secondary`;
const dangerOutlineButton = `${buttonBase} flex-1 border-[0.5px] border-border bg-card text-destructive hover:bg-secondary`;
const dangerButton = `${buttonBase} flex-[2] bg-destructive text-destructive-foreground hover:opacity-90`;

const badgeBase =
  'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

export function OwnerFieldCard({
  lng,
  field,
  sports,
  labels,
}: OwnerFieldCardProps) {
  const router = useRouter();

  const [panel, setPanel] = useState<Panel>('idle');
  const [busy, setBusy] = useState(false);
  const [blockedCount, setBlockedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const editHref = `/${lng}/owner/fields/${field.id}/edit`;
  const slotsHref = `/${lng}/owner/fields/${field.id}/slots`;
  const canArchive = field.status !== 'PENDING';

  async function handleArchive() {
    setBusy(true);
    setError(null);

    const result = await archiveField(field.id);

    if (result.status === 'ok') {
      router.refresh();
      return;
    }

    setBusy(false);

    if (result.status === 'blocked') {
      setBlockedCount(result.futureReservations);
      setPanel('blocked');
      return;
    }

    setError(labels.errorGeneric);
  }

  const badge = field.archived
    ? {
        text: labels.badgeArchived,
        className: 'bg-secondary text-muted-foreground',
      }
    : field.status === 'APPROVED'
      ? {
          text: labels.badgeApproved,
          className: 'bg-accent text-accent-foreground',
        }
      : field.status === 'PENDING'
        ? {
            text: labels.badgePending,
            className: 'bg-secondary text-terracotta',
          }
        : {
            text: labels.badgeRejected,
            className: 'bg-secondary text-destructive',
          };

  const blockedText =
    blockedCount === 1
      ? labels.blockedOne
      : labels.blockedOther.replace('{count}', String(blockedCount));

  return (
    <article
      className={`min-w-0 rounded-xl border-[0.5px] border-border bg-card p-4 ${
        field.archived ? 'opacity-80' : ''
      }`}
    >
      <div className="flex gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-accent sm:size-22">
          {field.imageUrl ? (
            <Image
              src={field.imageUrl}
              alt=""
              fill
              sizes="88px"
              className={`object-cover ${field.archived ? 'grayscale' : ''}`}
            />
          ) : (
            <span className="flex size-full items-center justify-center text-accent-foreground">
              {field.archived ? (
                <Archive className="size-6" aria-hidden="true" />
              ) : (
                <ImageIcon className="size-6" aria-hidden="true" />
              )}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span className={`${badgeBase} ${badge.className}`}>
            {badge.text}
          </span>

          <h3 className="mt-1 min-w-0 wrap-break-word">{field.name}</h3>

          <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 wrap-break-word ">{field.area}</span>
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
            {sports.map((sport) => (
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

      {field.archived ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {labels.archivedNote}
        </p>
      ) : null}

      {!field.archived && field.status === 'PENDING' ? (
        <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {labels.pendingNote}
        </p>
      ) : null}

      {!field.archived &&
      field.status === 'REJECTED' &&
      field.rejectionReason ? (
        <div className="mt-3 rounded-xl bg-secondary px-3 py-2">
          <h4 className="text-xs font-medium text-muted-foreground">
            {labels.rejectedReason}
          </h4>
          <p className="mt-0.5 whitespace-pre-line text-foreground">
            {field.rejectionReason}
          </p>
        </div>
      ) : null}

      {!field.archived && panel === 'idle' ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {field.status === 'APPROVED' ? (
            <Link href={slotsHref} className={primaryButton}>
              {labels.availability}
            </Link>
          ) : null}
          {field.status === 'APPROVED' ? (
            <Link href={`/${lng}/fields/${field.id}`} className={outlineButton}>
              {labels.view}
            </Link>
          ) : null}
          <Link
            href={editHref}
            className={
              field.status === 'REJECTED' ? primaryButton : outlineButton
            }
          >
            {field.status === 'REJECTED' ? labels.resubmit : labels.edit}
          </Link>
          {canArchive ? (
            <button
              type="button"
              onClick={() => setPanel('confirm')}
              className={dangerOutlineButton}
            >
              {labels.archive}
            </button>
          ) : null}
        </div>
      ) : null}

      {!field.archived && panel === 'confirm' ? (
        <div className="mt-4 border-t-[0.5px] border-border pt-4">
          <h4 className="font-medium text-foreground">{labels.confirmTitle}</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.confirmBody}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={handleArchive}
              className={dangerButton}
            >
              {busy ? labels.working : labels.confirmAction}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setPanel('idle');
                setError(null);
              }}
              className={outlineButton}
            >
              {labels.cancel}
            </button>
          </div>
        </div>
      ) : null}

      {!field.archived && panel === 'blocked' ? (
        <div className="mt-4 border-t-[0.5px] border-border pt-4">
          <h4 className="font-medium text-foreground">{labels.blockedTitle}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{blockedText}</p>
          <div className="mt-3 flex">
            <button
              type="button"
              onClick={() => setPanel('idle')}
              className={outlineButton}
            >
              {labels.ok}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </article>
  );
}
