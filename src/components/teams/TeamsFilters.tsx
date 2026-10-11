'use client';

import { usePathname, useRouter } from 'next/navigation';
import { UserSearch } from 'lucide-react';
import { chipBase, chipOff, chipOn } from '@/components/fields/chipStyles';
import type { SportType } from '@/lib/fields/types';
import { buildTeamsQuery, type TeamFilters } from '@/lib/teams/team-filters';

export interface TeamsFiltersProps {
  filters: TeamFilters;
  sports: { value: SportType; label: string }[];
  labels: {
    sportLabel: string;
    sportAll: string;
    recruiting: string;
  };
}

export function TeamsFilters({ filters, sports, labels }: TeamsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  function apply(patch: Partial<TeamFilters>) {
    const query = buildTeamsQuery({ ...filters, ...patch });
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
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

      <button
        type="button"
        aria-pressed={filters.recruiting}
        onClick={() => apply({ recruiting: !filters.recruiting })}
        className={`${chipBase} gap-2 sm:ml-auto ${filters.recruiting ? chipOn : chipOff}`}
      >
        <UserSearch className="size-4" aria-hidden="true" />
        {labels.recruiting}
      </button>
    </div>
  );
}
