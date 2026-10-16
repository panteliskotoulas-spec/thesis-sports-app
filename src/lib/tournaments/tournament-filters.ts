import type { SearchParams } from '@/lib/fields/filters';
import {
  isTournamentSport,
  isTournamentStatus,
  type TournamentSport,
  type TournamentStatus,
} from './tournament';

export interface TournamentFilters {
  sport: TournamentSport | null;
  status: TournamentStatus | null;
  mine: boolean;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseTournamentFilters(
  params: SearchParams,
): TournamentFilters {
  const sport = firstValue(params.sport);
  const status = firstValue(params.status);

  return {
    sport: isTournamentSport(sport) ? sport : null,
    status: isTournamentStatus(status) ? status : null,
    mine: firstValue(params.mine) === '1',
  };
}

export function buildTournamentsQuery(filters: TournamentFilters): string {
  const params = new URLSearchParams();
  if (filters.sport) params.set('sport', filters.sport);
  if (filters.status) params.set('status', filters.status);
  if (filters.mine) params.set('mine', '1');
  return params.toString();
}

export function hasActiveTournamentFilters(
  filters: TournamentFilters,
): boolean {
  return Boolean(filters.sport || filters.status || filters.mine);
}
