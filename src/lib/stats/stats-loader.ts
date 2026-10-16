import 'server-only';
import { getServerCaller } from '@/trpc/server/caller';
import { EMPTY_PLAYER_STATS, type PlayerStatsData } from './player-stats';

export async function loadPlayerStats(): Promise<PlayerStatsData> {
  try {
    const caller = await getServerCaller();
    return await caller.stats.mine();
  } catch (error) {
    console.error('[loadPlayerStats]', error);
    return EMPTY_PLAYER_STATS;
  }
}
