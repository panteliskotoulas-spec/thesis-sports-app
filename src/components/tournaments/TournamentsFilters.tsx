'use client';

import { usePathname, useRouter } from 'next/navigation';
import { chipBase, chipOff, chipOn } from '@/components/fields/chipStyles';
import type {
  TournamentSport,
  TournamentStatus,
} from '@/lib/tournaments/tournament';
import {
  buildTournamentsQuery,
  type TournamentFilters,
} from '@/lib/tournaments/tournament-filters';

export interface TournamentsFiltersProps {
  filters: TournamentFilters;
  sports: { value: TournamentSport; label: string }[];
  statuses: { value: TournamentStatus; label: string }[];
  labels: {
    sportLabel: string;
    sportAll: string;
    statusLabel: string;
    statusAll: string;
  };
}

export function TournamentsFilters({
  filters,
  sports,
  statuses,
  labels,
}: TournamentsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  function apply(patch: Partial<TournamentFilters>) {
    const query = buildTournamentsQuery({ ...filters, ...patch });
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="group"
        aria-label={labels.sportLabel}
        className="flex flex-wrap gap-2"
      >
        <button
          type="button"
          aria-pressed={filters.sport === null}
          onClick={() => apply({ sport: null })}
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
              onClick={() => apply({ sport: option.value })}
              className={`${chipBase} ${active ? chipOn : chipOff}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div
        role="group"
        aria-label={labels.statusLabel}
        className="flex flex-wrap gap-2"
      >
        <button
          type="button"
          aria-pressed={filters.status === null}
          onClick={() => apply({ status: null })}
          className={`${chipBase} ${filters.status === null ? chipOn : chipOff}`}
        >
          {labels.statusAll}
        </button>
        {statuses.map((option) => {
          const active = filters.status === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => apply({ status: option.value })}
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
