'use client';

import { useState } from 'react';
import { FormField } from '@/components/shared/FormField';

type AccountType = 'INDIVIDUAL' | 'BUSINESS';

export interface RegisterFormProps {
  labels: {
    accountType: string;
    individual: string;
    business: string;
    name: string;
    nameBusiness: string;
    businessName: string;
    taxId: string;
    email: string;
    password: string;
    passwordHint: string;
    submit: string;
  };
}

export function RegisterForm({ labels }: RegisterFormProps) {
  const [accountType, setAccountType] = useState<AccountType>('INDIVIDUAL');
  const isBusiness = accountType === 'BUSINESS';

  const options: { value: AccountType; label: string }[] = [
    { value: 'INDIVIDUAL', label: labels.individual },
    { value: 'BUSINESS', label: labels.business },
  ];

  return (
    <form
      className="flex flex-col gap-4"
      // ΠΡΟΣΩΡΙΝΟ: χωρίς αυτό, το submit στέλνει τα πεδία (και τον κωδικό) στο URL.
      // Φεύγει όταν μπει η πραγματική λογική εγγραφής.
      onSubmit={(e) => e.preventDefault()}
    >
      {/* Διακόπτης Άτομο / Επιχείρηση: πραγματικά radio inputs, οπότε δουλεύει με πληκτρολόγιο */}
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
            required
          />

          <FormField
            id="taxId"
            type="text"
            label={labels.taxId}
            inputMode="numeric"
            autoComplete="off"
            required
          />
        </>
      )}

      <FormField
        id="name"
        type="text"
        label={isBusiness ? labels.nameBusiness : labels.name}
        autoComplete="name"
        required
      />

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
        hint={labels.passwordHint}
        autoComplete="new-password"
        minLength={8}
        required
      />

      <button
        type="submit"
        className="mt-2 h-11 w-full rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {labels.submit}
      </button>
    </form>
  );
}
