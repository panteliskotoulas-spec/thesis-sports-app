'use client';

import { ArrowUpDown, ChevronDown } from 'lucide-react';
import {
  FIELD_SORTS,
  type FieldFilters,
  type FieldSort,
} from '@/lib/fields/filters';
import { useApplyFilters } from './useApplyFilters';

export interface FieldsSortProps {
  filters: FieldFilters;
  label: string;
  options: Record<FieldSort, string>;
}

export function FieldsSort({ filters, label, options }: FieldsSortProps) {
  const apply = useApplyFilters();

  return (
    <label className="relative inline-flex h-9 items-center gap-1.5 rounded-full border-[0.5px] border-border bg-card pr-8 pl-3 text-sm font-medium text-foreground">
      <ArrowUpDown className="size-4 shrink-0" aria-hidden="true" />
      <span className="text-muted-foreground">{label}</span>
      <select
        key={filters.sort}
        defaultValue={filters.sort}
        onChange={(event) =>
          apply({ ...filters, sort: event.target.value as FieldSort })
        }
        className="cursor-pointer appearance-none bg-transparent outline-none"
      >
        {FIELD_SORTS.map((sort) => (
          <option key={sort} value={sort} className="bg-card text-foreground">
            {options[sort]}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 size-4"
        aria-hidden="true"
      />
    </label>
  );
}
