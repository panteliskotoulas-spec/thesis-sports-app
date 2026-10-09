'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Search, X } from 'lucide-react';
import type { FieldFilters, FieldTypeFilter } from '@/lib/fields/filters';
import type { SportType } from '@/lib/fields/types';
import { useApplyFilters } from './useApplyFilters';

export interface FieldsFiltersLabels {
  search: string;
  searchLabel: string;
  date: string;
  clearDate: string;
  typeLabel: string;
  typeAll: string;
  typeOutdoor: string;
  typeIndoor: string;
  sportLabel: string;
  sportAll: string;
}

export interface FieldsFiltersProps {
  filters: FieldFilters;
  today: string;
  sports: { value: SportType; label: string }[];
  labels: FieldsFiltersLabels;
}

const chipBase =
  'inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full border-[0.5px] px-4 text-sm font-medium';
const chipOn = 'border-primary bg-primary text-primary-foreground';
const chipOff = 'border-border bg-card text-foreground hover:bg-secondary';

export function FieldsFilters({
  filters,
  today,
  sports,
  labels,
}: FieldsFiltersProps) {
  const apply = useApplyFilters();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState(filters.q);
  const [committed, setCommitted] = useState(filters.q);
  const [seenQuery, setSeenQuery] = useState(filters.q);

  if (seenQuery !== filters.q) {
    setSeenQuery(filters.q);
    if (filters.q !== committed) {
      setQuery(filters.q);
      setCommitted(filters.q);
    }
  }

  useEffect(() => {
    const ref = timer;
    return () => {
      if (ref.current) clearTimeout(ref.current);
    };
  }, []);

  const types: { value: FieldTypeFilter | null; label: string }[] = [
    { value: null, label: labels.typeAll },
    { value: 'outdoor', label: labels.typeOutdoor },
    { value: 'indoor', label: labels.typeIndoor },
  ];

  function commit(patch: Partial<FieldFilters>) {
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim();
    setCommitted(q);
    apply({ ...filters, q, ...patch });
  }

  function handleSearch(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const q = value.trim();
      setCommitted(q);
      apply({ ...filters, q }, { replace: true });
    }, 300);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:max-w-lg md:flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => handleSearch(event.target.value)}
            aria-label={labels.searchLabel}
            placeholder={labels.search}
            className="h-11 w-full rounded-md border-[0.5px] border-input bg-card pr-4 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2"
          />
        </div>

        <div
          className={`inline-flex h-11 items-center gap-2 self-start rounded-full border-[0.5px] px-4 text-sm ${
            filters.date
              ? 'border-accent bg-accent text-accent-foreground'
              : 'border-border bg-card text-foreground'
          }`}
        >
          <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
          <input
            key={filters.date ?? ''}
            type="date"
            aria-label={labels.date}
            min={today}
            defaultValue={filters.date ?? ''}
            onChange={(event) => commit({ date: event.target.value || null })}
            className="bg-transparent text-sm outline-none"
          />
          {filters.date ? (
            <button
              type="button"
              aria-label={labels.clearDate}
              onClick={() => commit({ date: null })}
              className="inline-flex size-6 items-center justify-center rounded-full hover:bg-secondary"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div
          role="group"
          aria-label={labels.typeLabel}
          className="flex gap-1 rounded-full border-[0.5px] border-border bg-card p-1"
        >
          {types.map((option) => {
            const active = filters.type === option.value;
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={active}
                onClick={() => commit({ type: option.value })}
                className={`h-9 flex-1 rounded-full px-4 text-sm font-medium md:flex-none ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="group"
        aria-label={labels.sportLabel}
        className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
      >
        <button
          type="button"
          aria-pressed={filters.sport === null}
          onClick={() => commit({ sport: null })}
          className={`${chipBase} ${filters.sport === null ? chipOn : chipOff}`}
        >
          {labels.sportAll}
        </button>
        {sports.map((option) => {
          const active = filters.sport === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => commit({ sport: option.value })}
              className={`${chipBase} ${active ? chipOn : chipOff}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
