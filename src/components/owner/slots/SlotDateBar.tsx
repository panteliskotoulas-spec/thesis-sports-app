'use client';

import { usePathname, useRouter } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import { chipBase, chipOff, chipOn } from '@/components/fields/chipStyles';

export interface SlotDateBarLabels {
  date: string;
  today: string;
  tomorrow: string;
}

export interface SlotDateBarProps {
  selectedDay: string;
  today: string;
  tomorrow: string;
  dayLabel: string;
  labels: SlotDateBarLabels;
}

export function SlotDateBar({
  selectedDay,
  today,
  tomorrow,
  dayLabel,
  labels,
}: SlotDateBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  function select(day: string) {
    if (!day || day < today || day === selectedDay) return;
    router.push(`${pathname}?date=${day}`, { scroll: false });
  }

  const shortcuts = [
    { value: today, label: labels.today },
    { value: tomorrow, label: labels.tomorrow },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {shortcuts.map((shortcut) => {
          const active = selectedDay === shortcut.value;
          return (
            <button
              key={shortcut.value}
              type="button"
              aria-pressed={active}
              onClick={() => select(shortcut.value)}
              className={`${chipBase} ${active ? chipOn : chipOff}`}
            >
              {shortcut.label}
            </button>
          );
        })}
        <label className="relative inline-flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border-[0.5px] border-border bg-card px-4 text-sm text-foreground sm:flex-none">
          <CalendarDays
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="sr-only">{labels.date}</span>
          <input
            key={selectedDay}
            type="date"
            min={today}
            defaultValue={selectedDay}
            onChange={(event) => select(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground first-letter:uppercase">
        {dayLabel}
      </p>
    </div>
  );
}
