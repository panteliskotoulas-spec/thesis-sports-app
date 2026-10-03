'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { FormField } from '@/components/shared/FormField';

type AccountType = 'INDIVIDUAL' | 'BUSINESS';

export interface RegisterFormProps {
  lng: string;
  labels: {
    accountType: string;
    individual: string;
    business: string;
    name: string;
    nameBusiness: string;
    businessName: string;
    taxId: string;
    taxIdHint: string;
    email: string;
    password: string;
    passwordHint: string;
    submit: string;
    submitting: string;
    errorGeneric: string;
    errorEmailTaken: string;
  };
}

export function RegisterForm({ lng, labels }: RegisterFormProps) {
  const router = useRouter();

  const [accountType, setAccountType] = useState<AccountType>('INDIVIDUAL');
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const isBusiness = accountType === 'BUSINESS';

  const options: { value: AccountType; label: string }[] = [
    { value: 'INDIVIDUAL', label: labels.individual },
    { value: 'BUSINESS', label: labels.business },
  ];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setFormError(null);
    setEmailError(null);

    const form = new FormData(e.currentTarget);
    const text = (key: string) => String(form.get(key) ?? '').trim();

    try {
      const { error } = await authClient.signUp.email({
        name: text('name'),
        email: text('email'),
        password: String(form.get('password') ?? ''), // ο κωδικός δεν κόβεται (trim)
        accountType,
        ...(isBusiness && {
          businessName: text('businessName'),
          taxId: text('taxId').replace(/\s/g, ''),
        }),
      });

      if (error) {
        if (error.code?.startsWith('USER_ALREADY_EXISTS')) {
          setEmailError(labels.errorEmailTaken);
        } else {
          setFormError(labels.errorGeneric);
        }
        setPending(false);
        return;
      }

      // Το Better Auth κάνει αυτόματα sign in μετά την εγγραφή.
      router.push(`/${lng}`);
      router.refresh();
    } catch {
      setFormError(labels.errorGeneric);
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {/* Διακόπτης Άτομο / Επιχείρηση */}
      <fieldset className="grid grid-cols-2 gap-1 rounded-full border-[0.5px] border-border bg-muted p-1">
        <legend className="sr-only">{labels.accountType}</legend>

        {options.map(({ value, label }) => (
          <label
            key={value}
            className="flex h-9 cursor-pointer items-center justify-center rounded-full border-[0.5px] border-transparent text-sm text-muted-foreground has-checked:border-border has-checked:bg-card has-checked:text-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring/50"
          >
            <input
              type="radio"
              name="accountType"
              value={value}
              checked={accountType === value}
              onChange={() => setAccountType(value)}
              disabled={pending}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </fieldset>

      {isBusiness && (
        <>
          <FormField
            id="businessName"
            type="text"
            label={labels.businessName}
            autoComplete="organization"
            minLength={2}
            maxLength={120}
            required
          />

          <FormField
            id="taxId"
            type="text"
            label={labels.taxId}
            hint={labels.taxIdHint}
            inputMode="numeric"
            autoComplete="off"
            pattern="[0-9]{9}"
            maxLength={9}
            required
          />
        </>
      )}

      <FormField
        id="name"
        type="text"
        label={isBusiness ? labels.nameBusiness : labels.name}
        autoComplete="name"
        minLength={2}
        maxLength={100}
        required
      />

      <FormField
        id="email"
        type="email"
        label={labels.email}
        autoComplete="email"
        error={emailError ?? undefined}
        required
      />

      <FormField
        id="password"
        type="password"
        label={labels.password}
        hint={labels.passwordHint}
        autoComplete="new-password"
        minLength={8}
        required
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
