'use client';

import { useState } from 'react';

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
  bookNote: string;
}

export function FieldSlots({
  slots,
  heading,
  bookLabel,
  bookNote,
}: FieldSlotsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

      <button
        type="button"
        disabled
        className="mt-4 h-11 w-full rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        {bookLabel}
      </button>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {bookNote}
      </p>
    </div>
  );
}
