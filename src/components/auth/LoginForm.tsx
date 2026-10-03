'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { FormField } from '@/components/shared/FormField';

export interface LoginFormProps {
  lng: string;
  labels: {
    email: string;
    password: string;
    forgot: string;
    submit: string;
    submitting: string;
    errorInvalid: string;
    errorGeneric: string;
  };
}

export function LoginForm({ lng, labels }: LoginFormProps) {
  const router = useRouter();

  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setFormError(null);

    const form = new FormData(e.currentTarget);

    try {
      const { error } = await authClient.signIn.email({
        email: String(form.get('email') ?? '').trim(),
        password: String(form.get('password') ?? ''), // ο κωδικός δεν κόβεται (trim)
      });

      if (error) {
        // Γενικό μήνυμα: δεν φαίνεται αν το email υπάρχει ή όχι.
        const isCredentialsError = error.status === 400 || error.status === 401;
        setFormError(
          isCredentialsError ? labels.errorInvalid : labels.errorGeneric,
        );
        setPending(false);
        return;
      }

      router.push(`/${lng}`);
      router.refresh();
    } catch {
      setFormError(labels.errorGeneric);
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <FormField
        id="email"
        type="email"
        label={labels.email}
        autoComplete="email"
        required
      />

      <FormField
        id="password"
        type="password"
        label={labels.password}
        autoComplete="current-password"
        required
        labelAction={
          <Link
            href={`/${lng}/forgot-password`}
            className="text-xs text-terracotta hover:text-terracotta-strong hover:underline"
          >
            {labels.forgot}
          </Link>
        }
      />

      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-11 w-full rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
