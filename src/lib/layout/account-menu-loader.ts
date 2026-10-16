import 'server-only';
import { cache } from 'react';
import { getServerCaller } from '@/trpc/server/caller';
import type { CoachMenuStatus } from './account-menu';

export const loadCoachMenuStatus = cache(
  async (): Promise<CoachMenuStatus | null> => {
    try {
      const caller = await getServerCaller();
      const record = await caller.coaches.getMine();
      return record?.status ?? null;
    } catch {
      return null;
    }
  },
);
