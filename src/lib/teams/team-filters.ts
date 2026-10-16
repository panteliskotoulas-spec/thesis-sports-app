import type { SearchParams } from '@/lib/fields/filters';
import { SPORT_TYPES, type SportType } from '@/lib/fields/types';

export interface TeamFilters {
  sport: SportType | null;
  recruiting: boolean;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseTeamFilters(params: SearchParams): TeamFilters {
  const sport = firstValue(params.sport);

  return {
    sport: SPORT_TYPES.find((option) => option === sport) ?? null,
    recruiting: firstValue(params.recruiting) === '1',
  };
}

export function buildTeamsQuery(filters: TeamFilters): string {
  const params = new URLSearchParams();
  if (filters.sport) params.set('sport', filters.sport);
  if (filters.recruiting) params.set('recruiting', '1');
  return params.toString();
}

export function hasActiveTeamFilters(filters: TeamFilters): boolean {
  return Boolean(filters.sport || filters.recruiting);
}
