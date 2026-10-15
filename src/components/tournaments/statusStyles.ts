import type { TournamentStatus } from '@/lib/tournaments/tournament';

export const STATUS_STYLES: Record<TournamentStatus, string> = {
  UPCOMING: 'bg-secondary text-muted-foreground',
  ONGOING: 'bg-terracotta/15 text-terracotta',
  COMPLETED: 'bg-accent text-accent-foreground',
};
