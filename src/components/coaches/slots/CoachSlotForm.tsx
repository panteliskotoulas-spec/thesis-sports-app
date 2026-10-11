'use client';

import { useState, type FormEvent } from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import type { CreateCoachSlotInput } from '@/lib/coaches/coach-public';
import {
  currentAthensMinutes,
  parsePrice,
  validateSlotDraft,
  type CreateSlotResult,
  type SlotDraft,
  type SlotDraftError,
} from '@/lib/fields/owner-slots';
import type { SportType } from '@/lib/fields/types';

export interface CoachSlotFormLabels {
  title: string;
  date: string;
  start: string;
  end: string;
  price: string;
  pricePlaceholder: string;
  submit: string;
  submitting: string;
  errorDate: string;
  errorStart: string;
  errorEnd: string;
  errorOrder: string;
  errorPast: string;
  errorPrice: string;
  errorOverlap: string;
  errorInvalid: string;
  errorGeneric: string;
}

export interface CoachSlotFormProps {
  sportType: SportType;
  selectedDay: string;
  today: string;
  labels: CoachSlotFormLabels;
  onCreate: (input: CreateCoachSlotInput) => Promise<CreateSlotResult>;
}

const fieldClass =
  'h-11 w-full rounded-md border-[0.5px] border-input bg-card px-3.5 text-sm text-foreground';
const labelClass = 'mb-1.5 block text-sm text-muted-foreground';

function errorText(error: SlotDraftError, labels: CoachSlotFormLabels): string {
  switch (error) {
    case 'date':
      return labels.errorDate;
    case 'start':
      return labels.errorStart;
    case 'end':
      return labels.errorEnd;
    case 'order':
      return labels.errorOrder;
    case 'past':
      return labels.errorPast;
    case 'price':
      return labels.errorPrice;
    default:
      return labels.errorGeneric;
  }
}

export function CoachSlotForm({
  sportType,
  selectedDay,
  today,
  labels,
  onCreate,
}: CoachSlotFormProps) {
  const [date, setDate] = useState(selectedDay);
  const [seenDay, setSeenDay] = useState(selectedDay);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (seenDay !== selectedDay) {
    setSeenDay(selectedDay);
    setDate(selectedDay);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const draft: SlotDraft = { date, startTime, endTime, sportType, price };
    const invalid = validateSlotDraft(draft, today, currentAthensMinutes());
    if (invalid) {
      setError(errorText(invalid, labels));
      return;
    }

    const parsedPrice = parsePrice(price);
    if (parsedPrice === null) return;

    setBusy(true);
    setError(null);

    const result = await onCreate({
      date,
      startTime,
      endTime,
      price: parsedPrice,
    });

    setBusy(false);

    if (result.status === 'ok') {
      setStartTime('');
      setEndTime('');
      setPrice('');
      return;
    }

    setError(
      result.status === 'overlap'
        ? labels.errorOverlap
        : result.status === 'invalid'
          ? labels.errorInvalid
          : labels.errorGeneric,
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-xl border-[0.5px] border-border bg-card p-4 sm:p-5"
    >
      <h2 className="text-lg">{labels.title}</h2>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label htmlFor="coach-slot-date" className={labelClass}>
            {labels.date}
          </label>
          <input
            id="coach-slot-date"
            type="date"
            min={today}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:col-span-2">
          <div>
            <label htmlFor="coach-slot-start" className={labelClass}>
              {labels.start}
            </label>
            <input
              id="coach-slot-start"
              type="time"
              step={300}
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="coach-slot-end" className={labelClass}>
              {labels.end}
            </label>
            <input
              id="coach-slot-end"
              type="time"
              step={300}
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className={fieldClass}
            />
          </div>
        </div>
      </div>

      <div className="mt-3">
        <label htmlFor="coach-slot-price" className={labelClass}>
          {labels.price}
        </label>
        <input
          id="coach-slot-price"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={labels.pricePlaceholder}
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className={`${fieldClass} sm:max-w-48`}
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-xl border-[0.5px] border-destructive px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <Plus className="size-4" aria-hidden="true" />
        {busy ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
