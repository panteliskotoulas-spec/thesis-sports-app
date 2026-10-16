import 'server-only';
import type { MyJoinRequestRow } from '@/lib/home/dashboard';
import { getServerCaller } from '@/trpc/server/caller';
import { toTeamListItem, type TeamListItem } from './team';

export interface MyTeamsData {
  leading: TeamListItem[];
  member: TeamListItem[];
  requests: MyJoinRequestRow[];
}

export async function loadMyTeams(lng: string): Promise<MyTeamsData | null> {
  try {
    const caller = await getServerCaller();
    const [teams, requests] = await Promise.all([
      caller.teams.myTeams(),
      caller.dashboard.myJoinRequests(),
    ]);

    const leading: TeamListItem[] = [];
    const member: TeamListItem[] = [];
    for (const row of teams) {
      const item = toTeamListItem(row, lng);
      if (row.role === 'LEADER') leading.push(item);
      else member.push(item);
    }

    return { leading, member, requests };
  } catch (error) {
    console.error('[loadMyTeams]', error);
    return null;
  }
}
