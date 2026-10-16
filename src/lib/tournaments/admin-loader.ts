import 'server-only';
import { localized } from '@/lib/i18n-content';
import { getServerCaller } from '@/trpc/server/caller';
import { toTournamentSports, type FieldOption, type TeamOption } from './admin';
import { isTournamentSport } from './tournament';

export async function loadFieldOptions(lng: string): Promise<FieldOption[]> {
  try {
    const caller = await getServerCaller();
    const rows = await caller.fields.list({
      q: '',
      type: null,
      sport: null,
      date: null,
      sort: 'newest',
    });
    return rows
      .map((row) => ({
        id: row.id,
        name: localized(row.name, lng),
        sports: toTournamentSports(row.sports),
      }))
      .filter((option) => option.sports.length > 0);
  } catch (error) {
    console.error('[loadFieldOptions]', error);
    return [];
  }
}

export async function loadTeamOptions(): Promise<TeamOption[]> {
  try {
    const caller = await getServerCaller();
    const rows = await caller.teams.list({ sport: null, recruiting: false });
    const options: TeamOption[] = [];
    for (const row of rows) {
      if (isTournamentSport(row.sportType)) {
        options.push({ id: row.id, name: row.name, sport: row.sportType });
      }
    }
    return options.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('[loadTeamOptions]', error);
    return [];
  }
}

export async function loadEditValues(id: string, lng: string) {
  try {
    const caller = await getServerCaller();
    return await caller.tournaments.editValues({
      id,
      lng: lng === 'en' ? 'en' : 'el',
    });
  } catch (error) {
    console.error('[loadEditValues]', error);
    return null;
  }
}
