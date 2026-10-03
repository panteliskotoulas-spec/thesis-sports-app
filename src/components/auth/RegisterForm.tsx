import { FormField } from '@/components/shared/FormField';

export interface RegisterFormProps {
  labels: {
    name: string;
    email: string;
    password: string;
    passwordHint: string;
    submit: string;
  };
}

export function RegisterForm({ labels }: RegisterFormProps) {
  return (
    <form className="flex flex-col gap-4">
      <FormField
        id="name"
        type="text"
        label={labels.name}
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
