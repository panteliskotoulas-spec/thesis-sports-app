'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CircleAlert } from 'lucide-react';
import { FormField } from '@/components/shared/FormField';
import { fillTemplate, formatAmount } from '@/lib/bookings/booking';
import type {
  DeletionBlocker,
  DeletionBlockerKind,
} from '@/lib/profile/profile';
import { deleteAccount, fetchDeletionStatus } from '@/lib/profile/profile-api';

export interface DeleteAccountPanelLabels {
  title: string;
  description: string;
  loading: string;
  error: string;
  retry: string;
  blockersTitle: string;
  blockers: Record<DeletionBlockerKind, { title: string; hint: string }>;
  creditWarning: string;
  creditAccept: string;
  passwordLabel: string;
  confirmLabel: string;
  confirmWord: string;
  submit: string;
  submitting: string;
  errorPassword: string;
  errorConfirm: string;
  errorCredit: string;
  errorWrongPassword: string;
  errorBlocked: string;
  errorUnauthorized: string;
  errorGeneric: string;
}

export interface DeleteAccountPanelProps {
  lng: 'el' | 'en';
  labels: DeleteAccountPanelLabels;
}

type DeletionState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ok'; blockers: DeletionBlocker[]; creditBalance: number };

interface FieldErrors {
  password?: string;
  confirm?: string;
  credit?: string;
}

export function DeleteAccountPanel({ lng, labels }: DeleteAccountPanelProps) {
  const router = useRouter();
  const [state, setState] = useState<DeletionState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchDeletionStatus().then((result) => {
      if (cancelled) return;
      setState(
        result.status === 'ok'
          ? {
              status: 'ok',
              blockers: result.blockers,
              creditBalance: result.creditBalance,
            }
          : { status: 'error' },
      );
    });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function reload() {
    setState({ status: 'loading' });
    setAttempt((value) => value + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || state.status !== 'ok') return;

    const data = new FormData(event.currentTarget);
    const password = String(data.get('delete-password') ?? '');
    const confirm = String(data.get('delete-confirm') ?? '').trim();
    const acceptCreditLoss = data.get('delete-credit') === 'on';

    setFormError(null);

    const found: FieldErrors = {};
    if (!password) found.password = labels.errorPassword;
    if (confirm !== labels.confirmWord) {
      found.confirm = fillTemplate(labels.errorConfirm, {
        word: labels.confirmWord,
      });
    }
    if (state.creditBalance > 0 && !acceptCreditLoss) {
      found.credit = labels.errorCredit;
    }

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setPending(true);

    const result = await deleteAccount({ password, acceptCreditLoss });

    if (result.status === 'ok') {
      router.push(`/${lng}`);
      router.refresh();
      return;
    }

    setPending(false);

    if (result.status === 'wrongPassword') {
      setErrors({ password: labels.errorWrongPassword });
      return;
    }
    if (result.status === 'blocked') {
      setFormError(labels.errorBlocked);
      reload();
      return;
    }
    if (result.status === 'unauthorized') {
      setFormError(labels.errorUnauthorized);
      return;
    }
    setFormError(labels.errorGeneric);
  }

  return (
    <section aria-labelledby="profile-delete-title">
      <h2
        id="profile-delete-title"
        className="text-lg font-medium text-destructive"
      >
        {labels.title}
      </h2>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        {labels.description}
      </p>

      {state.status === 'loading' ? (
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          {labels.loading}
        </p>
      ) : null}

      {state.status === 'error' ? (
        <div className="mt-4 flex flex-col items-start gap-3">
          <p role="alert" className="text-sm text-destructive">
            {labels.error}
          </p>
          <button
            type="button"
            onClick={reload}
            className="h-10 rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium hover:bg-secondary"
          >
            {labels.retry}
          </button>
        </div>
      ) : null}

      {state.status === 'ok' && state.blockers.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-medium">{labels.blockersTitle}</p>
          <ul className="mt-2 flex flex-col">
            {state.blockers.map((blocker) => (
              <li
                key={blocker.kind}
                className="flex items-start gap-3 border-t-[0.5px] border-border py-3 first:border-t-0"
              >
                <CircleAlert
                  className="mt-0.5 size-4 shrink-0 text-terracotta"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {labels.blockers[blocker.kind].title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {labels.blockers[blocker.kind].hint}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                  {blocker.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {state.status === 'ok' && state.blockers.length === 0 ? (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-5 flex max-w-md flex-col gap-4"
        >
          {state.creditBalance > 0 ? (
            <div className="flex flex-col gap-2 rounded-xl border-[0.5px] border-terracotta px-4 py-3">
              <p className="text-sm">
                {fillTemplate(labels.creditWarning, {
                  amount: formatAmount(state.creditBalance, lng),
                })}
              </p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="delete-credit"
                  onChange={() =>
                    setErrors((value) => ({ ...value, credit: undefined }))
                  }
                  className="size-4 accent-primary"
                />
                {labels.creditAccept}
              </label>
              {errors.credit ? (
                <p role="alert" className="text-xs text-destructive">
                  {errors.credit}
                </p>
              ) : null}
            </div>
          ) : null}

          <FormField
            id="delete-password"
            type="password"
            label={labels.passwordLabel}
            autoComplete="current-password"
            error={errors.password}
            onChange={() =>
              setErrors((value) => ({ ...value, password: undefined }))
            }
          />
          <FormField
            id="delete-confirm"
            type="text"
            label={fillTemplate(labels.confirmLabel, {
              word: labels.confirmWord,
            })}
            autoComplete="off"
            error={errors.confirm}
            onChange={() =>
              setErrors((value) => ({ ...value, confirm: undefined }))
            }
          />

          {formError ? (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="h-11 self-start rounded-full bg-destructive px-6 text-destructive-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? labels.submitting : labels.submit}
          </button>
        </form>
      ) : null}
    </section>
  );
}
