'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ImagePlus, X } from 'lucide-react';
import { FormField } from '@/components/shared/FormField';
import { fillTemplate } from '@/lib/bookings/booking';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_MB,
} from '@/lib/fields/new-field';
import {
  PROFILE_NAME_MAX,
  PROFILE_NAME_MIN,
  userInitials,
  type ProfileUser,
} from '@/lib/profile/profile';
import {
  updateProfileImage,
  updateProfileName,
  uploadAvatar,
} from '@/lib/profile/profile-api';

export interface ProfileDetailsLabels {
  title: string;
  avatarAdd: string;
  avatarChange: string;
  avatarRemove: string;
  avatarHint: string;
  avatarBusy: string;
  avatarErrorType: string;
  avatarErrorSize: string;
  avatarErrorGeneric: string;
  nameLabel: string;
  nameErrorShort: string;
  nameErrorLong: string;
  save: string;
  saving: string;
  saved: string;
  errorGeneric: string;
  accountTitle: string;
  email: string;
  accountType: string;
  typeIndividual: string;
  typeBusiness: string;
  businessName: string;
  taxId: string;
  lockedNote: string;
}

export interface ProfileDetailsPanelProps {
  user: ProfileUser;
  labels: ProfileDetailsLabels;
}

const outlineButton =
  'inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60';

export function ProfileDetailsPanel({
  user,
  labels,
}: ProfileDetailsPanelProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || avatarBusy) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setAvatarError(labels.avatarErrorType);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setAvatarError(labels.avatarErrorSize);
      return;
    }

    setAvatarBusy(true);
    setAvatarError(null);

    const upload = await uploadAvatar(file);
    if (upload.status !== 'ok') {
      setAvatarBusy(false);
      setAvatarError(labels.avatarErrorGeneric);
      return;
    }

    const result = await updateProfileImage(upload.url);
    setAvatarBusy(false);

    if (result.status !== 'ok') {
      setAvatarError(labels.avatarErrorGeneric);
      return;
    }

    setAvatarUrl(upload.url);
    router.refresh();
  }

  async function handleRemove() {
    if (avatarBusy) return;

    setAvatarBusy(true);
    setAvatarError(null);

    const result = await updateProfileImage(null);
    setAvatarBusy(false);

    if (result.status !== 'ok') {
      setAvatarError(labels.avatarErrorGeneric);
      return;
    }

    setAvatarUrl(null);
    router.refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const trimmed = name.trim();
    setSaved(false);
    setSaveError(null);

    if (trimmed.length < PROFILE_NAME_MIN) {
      setNameError(
        fillTemplate(labels.nameErrorShort, { min: String(PROFILE_NAME_MIN) }),
      );
      return;
    }
    if (trimmed.length > PROFILE_NAME_MAX) {
      setNameError(
        fillTemplate(labels.nameErrorLong, { max: String(PROFILE_NAME_MAX) }),
      );
      return;
    }

    setNameError(null);
    setSaving(true);

    const result = await updateProfileName(trimmed);
    setSaving(false);

    if (result.status !== 'ok') {
      setSaveError(labels.errorGeneric);
      return;
    }

    setName(trimmed);
    setSaved(true);
    router.refresh();
  }

  const initials = userInitials(name);

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="profile-details-title">
        <h2 id="profile-details-title" className="text-lg font-medium">
          {labels.title}
        </h2>

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <span
              aria-hidden="true"
              className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-2xl font-medium text-accent-foreground"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                initials
              )}
            </span>

            <div className="flex flex-wrap gap-2">
              <label
                className={`${outlineButton} has-focus-visible:ring-2 has-focus-visible:ring-ring/50 ${avatarBusy ? 'pointer-events-none opacity-60' : ''}`}
              >
                <ImagePlus className="size-4" aria-hidden="true" />
                {avatarBusy
                  ? labels.avatarBusy
                  : avatarUrl
                    ? labels.avatarChange
                    : labels.avatarAdd}
                <input
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  onChange={handleFile}
                  disabled={avatarBusy}
                  className="sr-only"
                />
              </label>
              {avatarUrl ? (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={avatarBusy}
                  className={outlineButton}
                >
                  <X className="size-4" aria-hidden="true" />
                  {labels.avatarRemove}
                </button>
              ) : null}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {fillTemplate(labels.avatarHint, { max: String(MAX_IMAGE_MB) })}
          </p>
          {avatarError ? (
            <p role="alert" className="text-sm text-destructive">
              {avatarError}
            </p>
          ) : null}
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 flex max-w-md flex-col gap-4"
        >
          <FormField
            id="profile-name"
            label={labels.nameLabel}
            value={name}
            autoComplete="name"
            error={nameError ?? undefined}
            onChange={(event) => {
              setName(event.target.value);
              setNameError(null);
              setSaved(false);
            }}
          />

          {saveError ? (
            <p role="alert" className="text-sm text-destructive">
              {saveError}
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-full bg-primary px-6 text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? labels.saving : labels.save}
            </button>
            {saved ? (
              <p role="status" className="text-sm text-muted-foreground">
                {labels.saved}
              </p>
            ) : null}
          </div>
        </form>
      </section>

      <section
        aria-labelledby="profile-account-title"
        className="border-t-[0.5px] border-border pt-6"
      >
        <h2 id="profile-account-title" className="text-lg font-medium">
          {labels.accountTitle}
        </h2>

        <dl className="mt-4 grid max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
          <dt className="text-muted-foreground">{labels.email}</dt>
          <dd className="min-w-0 wrap-break-word text-right">{user.email}</dd>

          <dt className="text-muted-foreground">{labels.accountType}</dt>
          <dd className="text-right">
            {user.accountType === 'BUSINESS'
              ? labels.typeBusiness
              : labels.typeIndividual}
          </dd>

          {user.accountType === 'BUSINESS' && user.businessName ? (
            <>
              <dt className="text-muted-foreground">{labels.businessName}</dt>
              <dd className="min-w-0 wrap-break-word text-right">
                {user.businessName}
              </dd>
            </>
          ) : null}

          {user.accountType === 'BUSINESS' && user.taxId ? (
            <>
              <dt className="text-muted-foreground">{labels.taxId}</dt>
              <dd className="text-right">{user.taxId}</dd>
            </>
          ) : null}
        </dl>

        <p className="mt-3 text-xs text-muted-foreground">
          {labels.lockedNote}
        </p>
      </section>
    </div>
  );
}
