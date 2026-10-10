'use client';

import { useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarDays } from 'lucide-react';

export interface FieldDatePickerProps {
  min: string;
  value: string | null;
  label: string;
}

export function FieldDatePicker({ min, value, label }: FieldDatePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    const input = inputRef.current;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      input.focus();
    }
  }

  return (
    <div className="relative h-full shrink-0">
      <button
        type="button"
        onClick={openPicker}
        aria-label={label}
        className="flex h-full min-h-16 w-14 items-center justify-center rounded-xl border-[0.5px] border-dashed border-border bg-card text-foreground hover:bg-secondary"
      >
        <CalendarDays className="size-5" aria-hidden="true" />
      </button>
      <input
        ref={inputRef}
        type="date"
        min={min}
        value={value ?? ''}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          if (event.target.value) {
            router.push(`${pathname}?date=${event.target.value}`, {
              scroll: false,
            });
          }
        }}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-0 w-full opacity-0"
      />
    </div>
  );
}
