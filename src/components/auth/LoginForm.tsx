import Link from 'next/link';
import { FormField } from '@/components/shared/FormField';

export interface LoginFormProps {
  lng: string;
  labels: {
    email: string;
    password: string;
    forgot: string;
    submit: string;
  };
}

export function LoginForm({ lng, labels }: LoginFormProps) {
  return (
    <form className="flex flex-col gap-4">
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

      <button
        type="submit"
        className="mt-2 h-11 w-full rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {labels.submit}
      </button>
    </form>
  );
}
