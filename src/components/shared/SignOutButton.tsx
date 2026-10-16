'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

export interface SignOutButtonProps {
  lng: string;
  label: string;
  variant?: 'icon' | 'menu';
}

export function SignOutButton({
  lng,
  label,
  variant = 'icon',
}: SignOutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      await authClient.signOut();
      router.push(`/${lng}`);
      router.refresh(); // ξαναδιαβάζει το session στους Server Components (Header)
    } finally {
      setPending(false);
    }
  }

  if (variant === 'menu') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogOut className="size-4 text-muted-foreground" aria-hidden="true" />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={label}
      title={label}
      className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
    >
      <LogOut className="size-4" aria-hidden="true" />
    </button>
  );
}
