'use client';

import { useState } from 'react';
import { fillTemplate, type CompensationValue } from '@/lib/bookings/booking';

export interface CancelPanelLabels {
  title: string;
  optionRefundTitle: string;
  optionRefundCard: string;
  optionRefundMixed: string;
  optionCredit: string;
  optionCreditTitle: string;
  warning: string;
  back: string;
  confirm: string;
  working: string;
}

export interface CancelPanelProps {
  total: string;
  card: string | null;
  credit: string | null;
  busy: boolean;
  error: string | null;
  labels: CancelPanelLabels;
  onBack: () => void;
  onConfirm: (compensation: CompensationValue) => void;
}

interface Option {
  value: CompensationValue;
  title: string;
  description: string;
}

export function CancelPanel({
  total,
  card,
  credit,
  busy,
  error,
  labels,
  onBack,
  onConfirm,
}: CancelPanelProps) {
  const options: Option[] = [];

  if (card) {
    options.push({
      value: 'REFUND',
      title: labels.optionRefundTitle,
      description: credit
        ? fillTemplate(labels.optionRefundMixed, { card, credit })
        : fillTemplate(labels.optionRefundCard, { amount: card }),
    });
  }

  options.push({
    value: 'CREDIT',
    title: labels.optionCreditTitle,
    description: fillTemplate(labels.optionCredit, { amount: total }),
  });

  const [selected, setSelected] = useState<CompensationValue>(options[0].value);

  return (
    <div className="mt-3 border-t-[0.5px] border-border pt-3">
      <p className="font-medium text-foreground">{labels.title}</p>

      <div role="radiogroup" aria-label={labels.title} className="mt-2.5">
        {options.map((option) => {
          const isSelected = option.value === selected;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={busy}
              onClick={() => setSelected(option.value)}
              className={`mb-2 flex w-full items-start gap-3 rounded-xl border-[0.5px] p-3 text-left disabled:cursor-not-allowed ${
                isSelected
                  ? 'border-primary bg-accent text-accent-foreground'
                  : 'border-border bg-card text-foreground hover:bg-secondary'
              }`}
            >
              <span
                aria-hidden="true"
                className={`relative mt-0.5 size-4.5 shrink-0 rounded-full border-[1.5px] ${
                  isSelected ? 'border-primary' : 'border-muted-foreground'
                }`}
              >
                {isSelected ? (
                  <span className="absolute inset-0.75 rounded-full bg-primary" />
                ) : null}
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-medium">{option.title}</span>
                <span className="text-sm text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-1 text-sm text-muted-foreground">{labels.warning}</p>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onBack}
          className="h-11 rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {labels.back}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onConfirm(selected)}
          className="h-11 rounded-full bg-destructive px-4 text-sm font-medium text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? labels.working : labels.confirm}
        </button>
      </div>
    </div>
  );
}
