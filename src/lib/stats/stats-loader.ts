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

export async function loadApplicantStats(
  requestId: string,
): Promise<PlayerStatsData> {
  try {
    const caller = await getServerCaller();
    return await caller.stats.forApplicant({ requestId });
  } catch (error) {
    console.error('[loadApplicantStats]', error);
    return EMPTY_PLAYER_STATS;
  }
}
