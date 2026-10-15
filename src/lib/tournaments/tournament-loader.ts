import 'server-only';
import type { TournamentFilters } from './tournament-filters';
import type { TournamentDetail, TournamentListItem } from './tournament';

export const loadTournamentList: (
  filters: TournamentFilters,
  lng: string,
) => Promise<TournamentListItem[]> = async () => [];

export const loadTournamentDetail: (
  id: string,
  lng: string,
) => Promise<TournamentDetail | null> = async () => null;
