'use client';

import { useState } from 'react';
import Link from 'next/link';

export interface SlotItem {
  id: string;
  time: string;
  sport: string;
  price: string;
}

export interface FieldSlotsProps {
  slots: SlotItem[];
  heading: string;
  bookLabel: string;
  pickHint: string;
  bookHref: string;
}

const bookClass =
  'flex h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground';

export function FieldSlots({
  slots,
  heading,
  bookLabel,
  pickHint,
  bookHref,
}: FieldSlotsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = slots.find((slot) => slot.id === selectedId) ?? null;
  const target = selected
    ? `${bookHref}?slot=${encodeURIComponent(selected.id)}`
    : null;

  return (
    <div>
      <h3 className="sr-only">{heading}</h3>
      <ul className="flex flex-col gap-2">
        {slots.map((slot) => {
          const isSelected = slot.id === selectedId;
          return (
            <li key={slot.id}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedId(isSelected ? null : slot.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border-[0.5px] px-3 py-3 text-left ${
                  isSelected
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'border-border bg-card text-foreground hover:bg-secondary'
                }`}
              >
                <span className="flex flex-col">
                  <span className="font-medium">{slot.time}</span>
                  <span className="text-sm text-muted-foreground">
                    {slot.sport}
                  </span>
                </span>
                <strong>{slot.price}</strong>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4">
        {target ? (
          <Link href={target} className={`${bookClass} w-full`}>
            {bookLabel}
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className={`${bookClass} w-full cursor-not-allowed opacity-50`}
          >
            {bookLabel}
          </button>
        )}
        {!selected ? (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {pickHint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
