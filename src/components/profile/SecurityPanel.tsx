'use client';

import { useState, type FormEvent } from 'react';
import { FormField } from '@/components/shared/FormField';
import { fillTemplate } from '@/lib/bookings/booking';
import { PASSWORD_MAX, PASSWORD_MIN } from '@/lib/profile/profile';
import { changePassword } from '@/lib/profile/profile-api';

export interface SecurityPanelLabels {
  title: string;
  currentLabel: string;
  newLabel: string;
  newHint: string;
  confirmLabel: string;
  revokeOthers: string;
  submit: string;
  submitting: string;
  success: string;
  errorCurrentRequired: string;
  errorNewShort: string;
  errorNewLong: string;
  errorNewSame: string;
  errorMismatch: string;
  errorWrongPassword: string;
  errorGeneric: string;
}

export interface SecurityPanelProps {
  labels: SecurityPanelLabels;
}

interface FieldErrors {
  current?: string;
  next?: string;
  confirm?: string;
}

export function SecurityPanel({ labels }: SecurityPanelProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  function clearFeedback() {
    setSuccess(false);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const current = String(data.get('security-current') ?? '');
    const next = String(data.get('security-new') ?? '');
    const confirm = String(data.get('security-confirm') ?? '');
    const revokeOthers = data.get('security-revoke') === 'on';

    clearFeedback();

    const found: FieldErrors = {};
    if (!current) found.current = labels.errorCurrentRequired;
    if (next.length < PASSWORD_MIN) {
      found.next = fillTemplate(labels.errorNewShort, {
        min: String(PASSWORD_MIN),
      });
    } else if (next.length > PASSWORD_MAX) {
      found.next = fillTemplate(labels.errorNewLong, {
        max: String(PASSWORD_MAX),
      });
    } else if (next === current) {
      found.next = labels.errorNewSame;
    }
    if (next !== confirm) found.confirm = labels.errorMismatch;

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setPending(true);

    const result = await changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: revokeOthers,
    });

    setPending(false);

    if (result.status === 'wrongPassword') {
      setErrors({ current: labels.errorWrongPassword });
      return;
    }
    if (result.status !== 'ok') {
      setFormError(labels.errorGeneric);
      return;
    }

    form.reset();
    setSuccess(true);
  }

  return (
    <section aria-labelledby="profile-security-title">
      <h2 id="profile-security-title" className="text-lg font-medium">
        {labels.title}
      </h2>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-4 flex max-w-md flex-col gap-4"
      >
        <FormField
          id="security-current"
          type="password"
          label={labels.currentLabel}
          autoComplete="current-password"
          error={errors.current}
          onChange={() => {
            clearFeedback();
            setErrors((value) => ({ ...value, current: undefined }));
          }}
        />
        <FormField
          id="security-new"
          type="password"
          label={labels.newLabel}
          hint={labels.newHint}
          autoComplete="new-password"
          error={errors.next}
          onChange={() => {
            clearFeedback();
            setErrors((value) => ({ ...value, next: undefined }));
          }}
        />
        <FormField
          id="security-confirm"
          type="password"
          label={labels.confirmLabel}
          autoComplete="new-password"
          error={errors.confirm}
          onChange={() => {
            clearFeedback();
            setErrors((value) => ({ ...value, confirm: undefined }));
          }}
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="security-revoke"
            defaultChecked
            className="size-4 accent-primary"
          />
          {labels.revokeOthers}
        </label>

        {formError ? (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="h-11 rounded-full bg-primary px-6 text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? labels.submitting : labels.submit}
          </button>
          {success ? (
            <p role="status" className="text-sm text-muted-foreground">
              {labels.success}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
