import type {
  StatTotals,
  TournamentDetail,
  TournamentListItem,
  TournamentMatch,
  TournamentPlayerTotals,
  TournamentSport,
  TournamentStatus,
} from './tournament';

export interface RawStatRow {
  userId: string;
  userName: string;
  teamId: string;
  stats: unknown;
}

export interface RawMatch {
  id: string;
  round: number;
  homeTeamId: string;
  awayTeamId: string;
  status: 'SCHEDULED' | 'COMPLETED';
  scheduledAt: Date | null;
  homeScore: number | null;
  awayScore: number | null;
  sets: unknown;
  statRows: RawStatRow[];
}

export interface RawTournament {
  id: string;
  name: string;
  sport: TournamentSport;
  status: TournamentStatus;
  startDate: Date;
  endDate: Date;
  maxTeams: number;
  description: string;
  fieldName: string;
  teams: { id: string; name: string }[];
  matches: RawMatch[];
}

export function parseStats(value: unknown): StatTotals {
  const result: StatTotals = {};
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, entry] of Object.entries(value)) {
      if (typeof entry === 'number' && Number.isFinite(entry)) {
        result[key] = entry;
      }
    }
  }
  return result;
}

export function parseSets(value: unknown): [number, number][] | null {
  if (!Array.isArray(value)) return null;
  const sets: [number, number][] = [];
  for (const entry of value) {
    if (
      Array.isArray(entry) &&
      entry.length === 2 &&
      typeof entry[0] === 'number' &&
      typeof entry[1] === 'number'
    ) {
      sets.push([entry[0], entry[1]]);
    }
  }
  return sets.length > 0 ? sets : null;
}

function addInto(target: StatTotals, source: StatTotals) {
  for (const [key, value] of Object.entries(source)) {
    target[key] = (target[key] ?? 0) + value;
  }
}

export function toListItem(raw: RawTournament): TournamentListItem {
  return {
    id: raw.id,
    name: raw.name,
    sport: raw.sport,
    status: raw.status,
    startDate: raw.startDate.toISOString(),
    endDate: raw.endDate.toISOString(),
    fieldName: raw.fieldName,
    teamCount: raw.teams.length,
    maxTeams: raw.maxTeams,
  };
}

export function buildDetail(raw: RawTournament): TournamentDetail {
  const players = new Map<string, TournamentPlayerTotals>();

  const matches: TournamentMatch[] = raw.matches.map((match) => {
    const completed = match.status === 'COMPLETED';
    let homeStats: StatTotals | null = null;
    let awayStats: StatTotals | null = null;

    if (completed) {
      for (const row of match.statRows) {
        const stats = parseStats(row.stats);
        const key = `${row.userId}:${row.teamId}`;
        const player = players.get(key) ?? {
          userId: row.userId,
          name: row.userName,
          teamId: row.teamId,
          games: 0,
          stats: {},
        };
        player.games += 1;
        addInto(player.stats, stats);
        players.set(key, player);

        if (row.teamId === match.homeTeamId) {
          homeStats = homeStats ?? {};
          addInto(homeStats, stats);
        } else if (row.teamId === match.awayTeamId) {
          awayStats = awayStats ?? {};
          addInto(awayStats, stats);
        }
      }
    }

    return {
      id: match.id,
      round: match.round,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      status: match.status,
      scheduledAt: match.scheduledAt ? match.scheduledAt.toISOString() : null,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      sets: completed ? parseSets(match.sets) : null,
      homeStats,
      awayStats,
    };
  });

  return {
    ...toListItem(raw),
    description: raw.description,
    teams: raw.teams,
    matches,
    players: Array.from(players.values()),
  };
}
