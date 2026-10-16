import 'server-only';
import { getServerCaller } from '@/trpc/server/caller';
import type { MyTournamentItem } from './my-tournaments';

export async function loadMyTournaments(
  lng: string,
): Promise<MyTournamentItem[] | null> {
  try {
    const caller = await getServerCaller();
    return await caller.dashboard.myTournaments({
      lng: lng === 'en' ? 'en' : 'el',
    });
  } catch (error) {
    console.error('[loadMyTournaments]', error);
    return null;
  }
}
