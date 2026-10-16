import Link from 'next/link';
import { Wallet } from 'lucide-react';

export interface CreditChipProps {
  href: string;
  amountText: string;
  ariaLabel: string;
}

export function CreditChip({ href, amountText, ariaLabel }: CreditChipProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border-[0.5px] border-border bg-card px-3 text-sm font-medium text-foreground hover:bg-secondary"
    >
      <Wallet className="size-4 text-muted-foreground" aria-hidden="true" />
      {amountText}
    </Link>
  );
}
