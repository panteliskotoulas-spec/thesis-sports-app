import type { TournamentListItem } from './tournament';

export type MyEntryState = 'PARTICIPATING' | 'PENDING';

export interface MyTournamentEntry {
  teamId: string;
  teamName: string;
  state: MyEntryState;
  requestId: string | null;
  canCancel: boolean;
}

export interface MyTournamentItem extends TournamentListItem {
  entries: MyTournamentEntry[];
}
