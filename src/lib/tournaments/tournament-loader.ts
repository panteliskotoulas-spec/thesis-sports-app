import 'server-only';
import { getServerCaller } from '@/trpc/server/caller';
import type { TournamentFilters } from './tournament-filters';
import type { TournamentDetail, TournamentListItem } from './tournament';

function toLanguage(lng: string): 'el' | 'en' {
  return lng === 'en' ? 'en' : 'el';
}

export async function loadTournamentList(
  filters: TournamentFilters,
  lng: string,
): Promise<TournamentListItem[]> {
  try {
    const caller = await getServerCaller();
    const input = {
      lng: toLanguage(lng),
      sport: filters.sport,
      status: filters.status,
    };
    return filters.mine
      ? await caller.tournaments.listMine(input)
      : await caller.tournaments.list(input);
  } catch (error) {
    console.error('[loadTournamentList]', error);
    return [];
  }
}

export async function loadTournamentDetail(
  id: string,
  lng: string,
): Promise<TournamentDetail | null> {
  try {
    const caller = await getServerCaller();
    return await caller.tournaments.detail({ id, lng: toLanguage(lng) });
  } catch (error) {
    console.error('[loadTournamentDetail]', error);
    return null;
  }
}
