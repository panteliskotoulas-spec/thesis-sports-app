import type {
  TournamentMatch,
  TournamentSport,
  TournamentTeamItem,
} from './tournament';

export interface StandingRow {
  teamId: string;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  scoreFor: number;
  scoreAgainst: number;
  diff: number;
  points: number;
}

export interface TrendSeries {
  teamId: string;
  name: string;
  points: number[];
}

export interface TrendData {
  rounds: number[];
  series: TrendSeries[];
}

export function matchPoints(
  sport: TournamentSport,
  own: number,
  other: number,
): number {
  if (sport === 'FOOTBALL') {
    if (own > other) return 3;
    return own === other ? 1 : 0;
  }
  if (sport === 'BASKETBALL') {
    return own > other ? 2 : 1;
  }
  if (own > other) return other >= 2 ? 2 : 3;
  return own >= 2 ? 1 : 0;
}

function isScored(match: TournamentMatch): boolean {
  return (
    match.status === 'COMPLETED' &&
    match.homeScore !== null &&
    match.awayScore !== null
  );
}

export function computeStandings(
  sport: TournamentSport,
  teams: TournamentTeamItem[],
  matches: TournamentMatch[],
  lng: string,
): StandingRow[] {
  const rows = new Map<string, StandingRow>(
    teams.map((team) => [
      team.id,
      {
        teamId: team.id,
        name: team.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        scoreFor: 0,
        scoreAgainst: 0,
        diff: 0,
        points: 0,
      },
    ]),
  );

  function apply(teamId: string, own: number, other: number) {
    const row = rows.get(teamId);
    if (!row) return;
    row.played += 1;
    row.scoreFor += own;
    row.scoreAgainst += other;
    if (own > other) row.won += 1;
    else if (own === other) row.drawn += 1;
    else row.lost += 1;
    row.points += matchPoints(sport, own, other);
  }

  for (const match of matches) {
    if (!isScored(match)) continue;
    const home = match.homeScore as number;
    const away = match.awayScore as number;
    apply(match.homeTeamId, home, away);
    apply(match.awayTeamId, away, home);
  }

  const result = Array.from(rows.values());
  for (const row of result) row.diff = row.scoreFor - row.scoreAgainst;

  return result.sort(
    (a, b) =>
      b.points - a.points ||
      b.diff - a.diff ||
      b.scoreFor - a.scoreFor ||
      b.won - a.won ||
      a.name.localeCompare(b.name, lng),
  );
}

export function computePointsTrend(
  sport: TournamentSport,
  standings: StandingRow[],
  matches: TournamentMatch[],
  limit: number,
): TrendData | null {
  const scored = matches.filter(isScored);
  const rounds = Array.from(new Set(scored.map((match) => match.round))).sort(
    (a, b) => a - b,
  );
  if (rounds.length < 2) return null;

  const perRound = new Map<string, Map<number, number>>();
  function add(teamId: string, round: number, points: number) {
    const byRound = perRound.get(teamId) ?? new Map<number, number>();
    byRound.set(round, (byRound.get(round) ?? 0) + points);
    perRound.set(teamId, byRound);
  }

  for (const match of scored) {
    const home = match.homeScore as number;
    const away = match.awayScore as number;
    add(match.homeTeamId, match.round, matchPoints(sport, home, away));
    add(match.awayTeamId, match.round, matchPoints(sport, away, home));
  }

  const series = standings.slice(0, limit).map((row) => {
    let total = 0;
    const points = rounds.map((round) => {
      total += perRound.get(row.teamId)?.get(round) ?? 0;
      return total;
    });
    return { teamId: row.teamId, name: row.name, points };
  });

  return { rounds, series };
}
