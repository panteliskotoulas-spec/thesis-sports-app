'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { chipBase, chipOff, chipOn } from '@/components/fields/chipStyles';
import {
  buildCoachesQuery,
  type CoachFilters,
} from '@/lib/coaches/coach-public';
import type { SportType } from '@/lib/fields/types';

export interface CoachesFiltersLabels {
  search: string;
  searchLabel: string;
  sportLabel: string;
  sportAll: string;
}

export interface CoachesFiltersProps {
  filters: CoachFilters;
  sports: { value: SportType; label: string }[];
  labels: CoachesFiltersLabels;
}

export function CoachesFilters({
  filters,
  sports,
  labels,
}: CoachesFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
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

  function apply(next: CoachFilters, replace: boolean) {
    const built = buildCoachesQuery(next);
    const url = built ? `${pathname}?${built}` : pathname;
    if (replace) {
      router.replace(url, { scroll: false });
    } else {
      router.push(url, { scroll: false });
    }
  }

  function handleSearch(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const q = value.trim();
      setCommitted(q);
      apply({ ...filters, q }, true);
    }, 300);
  }

  function selectSport(sport: SportType | null) {
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim();
    setCommitted(q);
    apply({ q, sport }, false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative min-w-0 md:max-w-lg">
        <MapPin
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
        role="group"
        aria-label={labels.sportLabel}
        className="flex gap-2 overflow-x-auto pb-1"
      >
        <button
          type="button"
          aria-pressed={filters.sport === null}
          onClick={() => selectSport(null)}
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
              onClick={() => selectSport(option.value)}
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
