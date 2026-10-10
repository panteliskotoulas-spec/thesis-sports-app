'use client';

import { Wallet } from 'lucide-react';
import { fillTemplate } from '@/lib/bookings/booking';

export interface CreditToggleLabels {
  title: string;
  available: string;
  none: string;
  toggle: string;
  limited: string;
}

export interface CreditToggleProps {
  balanceText: string;
  hasBalance: boolean;
  checked: boolean;
  limited: boolean;
  labels: CreditToggleLabels;
  onChange: (checked: boolean) => void;
}

export function CreditToggle({
  balanceText,
  hasBalance,
  checked,
  limited,
  labels,
  onChange,
}: CreditToggleProps) {
  return (
    <section className="rounded-xl border-[0.5px] border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <Wallet className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{labels.title}</p>
          <p className="text-sm text-muted-foreground">
            {hasBalance
              ? fillTemplate(labels.available, { amount: balanceText })
              : labels.none}
          </p>
        </div>
        {hasBalance ? (
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={labels.toggle}
            onClick={() => onChange(!checked)}
            className={`relative h-7 w-11.5 shrink-0 rounded-full transition-colors ${
              checked ? 'bg-primary' : 'bg-border'
            }`}
          >
            <span
              className={`absolute top-0.75 size-5.5 rounded-full bg-card transition-all ${
                checked ? 'left-5.25' : 'left-0.75'
              }`}
            />
          </button>
        ) : null}
      </div>
      {limited ? (
        <p className="mt-3 text-sm leading-relaxed text-terracotta">
          {labels.limited}
        </p>
      ) : null}
    </section>
  );
}
