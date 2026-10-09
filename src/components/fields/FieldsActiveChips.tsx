'use client';

import { X } from 'lucide-react';
import type { FieldFilters } from '@/lib/fields/filters';
import type { SportType } from '@/lib/fields/types';
import { useApplyFilters } from './useApplyFilters';

export interface FieldsActiveChipsProps {
  filters: FieldFilters;
  sports: { value: SportType; label: string }[];
  dateLabel: string | null;
  typeLabels: { indoor: string; outdoor: string };
  removeLabel: string;
}

type ChipId = 'date' | 'sport' | 'type';

export function FieldsActiveChips({
  filters,
  sports,
  dateLabel,
  typeLabels,
  removeLabel,
}: FieldsActiveChipsProps) {
  const apply = useApplyFilters();

  const chips: { id: ChipId; label: string }[] = [];
  if (filters.date && dateLabel) chips.push({ id: 'date', label: dateLabel });
  if (filters.sport) {
    const sport = sports.find((option) => option.value === filters.sport);
    if (sport) chips.push({ id: 'sport', label: sport.label });
  }
  if (filters.type) chips.push({ id: 'type', label: typeLabels[filters.type] });

  if (chips.length === 0) return null;

  function remove(id: ChipId) {
    const next: FieldFilters = { ...filters };
    next[id] = null;
    apply(next);
  }

  return (
    <ul className="flex flex-wrap gap-2 md:hidden">
      {chips.map((chip) => (
        <li key={chip.id}>
          <span className="inline-flex h-9 items-center gap-1 rounded-full border-[0.5px] border-accent bg-accent pr-1.5 pl-3.5 text-sm font-medium text-accent-foreground">
            {chip.label}
            <button
              type="button"
              aria-label={`${removeLabel}: ${chip.label}`}
              onClick={() => remove(chip.id)}
              className="inline-flex size-6 items-center justify-center rounded-full hover:bg-secondary"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}
