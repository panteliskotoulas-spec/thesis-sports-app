import {
  isTournamentSport,
  isTournamentStatus,
  type TournamentMatch,
  type TournamentSport,
  type TournamentStatus,
} from './tournament';

export const NAME_MAX = 80;
export const DESCRIPTION_MAX = 1000;
export const MIN_TEAMS = 2;
export const MAX_TEAMS = 16;
export const DEFAULT_MAX_TEAMS = 8;

export interface FieldOption {
  id: string;
  name: string;
  sports: TournamentSport[];
}

export interface TeamOption {
  id: string;
  name: string;
  sport: TournamentSport;
}

export interface TournamentFormValues {
  name: string;
  sport: TournamentSport | null;
  hostFieldId: string;
  startDay: string;
  endDay: string;
  maxTeams: string;
  description: string;
}

export type TournamentFormErrorKey =
  | 'name'
  | 'sport'
  | 'hostFieldId'
  | 'dates'
  | 'maxTeams'
  | 'description';

export type TournamentFormErrors = Partial<
  Record<TournamentFormErrorKey, true>
>;

export const EMPTY_FORM_VALUES: TournamentFormValues = {
  name: '',
  sport: null,
  hostFieldId: '',
  startDay: '',
  endDay: '',
  maxTeams: String(DEFAULT_MAX_TEAMS),
  description: '',
};

export function parseMaxTeams(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return parsed >= MIN_TEAMS && parsed <= MAX_TEAMS ? parsed : null;
}

export function validateTournamentForm(
  values: TournamentFormValues,
): TournamentFormErrors {
  const errors: TournamentFormErrors = {};
  const name = values.name.trim();

  if (name.length === 0 || name.length > NAME_MAX) errors.name = true;
  if (values.sport === null) errors.sport = true;
  if (values.hostFieldId === '') errors.hostFieldId = true;
  if (
    values.startDay === '' ||
    values.endDay === '' ||
    values.startDay > values.endDay
  ) {
    errors.dates = true;
  }
  if (parseMaxTeams(values.maxTeams) === null) errors.maxTeams = true;
  if (values.description.trim().length > DESCRIPTION_MAX) {
    errors.description = true;
  }

  return errors;
}

export function fieldsForSport(
  fields: FieldOption[],
  sport: TournamentSport | null,
): FieldOption[] {
  if (sport === null) return [];
  return fields.filter((field) => field.sports.includes(sport));
}

export function teamsForTournament(
  teams: TeamOption[],
  sport: TournamentSport,
  takenIds: string[],
): TeamOption[] {
  const taken = new Set(takenIds);
  return teams.filter((team) => team.sport === sport && !taken.has(team.id));
}

export function teamsLocked(
  status: TournamentStatus,
  matchCount: number,
): boolean {
  return status !== 'UPCOMING' || matchCount > 0;
}

export function parseAdminStatus(
  value: string | string[] | undefined,
): TournamentStatus | null {
  const first = Array.isArray(value) ? value[0] : value;
  return isTournamentStatus(first) ? first : null;
}

export interface RoundGroup {
  round: number;
  matches: TournamentMatch[];
}

export function groupByRound(matches: TournamentMatch[]): RoundGroup[] {
  const groups = new Map<number, TournamentMatch[]>();
  for (const match of matches) {
    const bucket = groups.get(match.round);
    if (bucket) bucket.push(match);
    else groups.set(match.round, [match]);
  }
  return Array.from(groups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([round, items]) => ({ round, matches: items }));
}

export function toAthensParts(iso: string): { day: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Athens',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const pick = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return {
    day: `${pick('year')}-${pick('month')}-${pick('day')}`,
    time: `${pick('hour')}:${pick('minute')}`,
  };
}

export function toTournamentSports(values: string[]): TournamentSport[] {
  return values.filter(isTournamentSport);
}
