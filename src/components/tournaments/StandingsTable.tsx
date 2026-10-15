import type { StandingRow } from '@/lib/tournaments/standings';
import type { TournamentSport } from '@/lib/tournaments/tournament';
import type {
  StandingColumn,
  StandingsLabels,
} from '@/lib/tournaments/tournament-labels';

const COLUMNS: Record<TournamentSport, StandingColumn[]> = {
  FOOTBALL: ['played', 'won', 'drawn', 'lost', 'diffGoals', 'points'],
  BASKETBALL: ['played', 'won', 'lost', 'diffPoints', 'points'],
  VOLLEYBALL: ['played', 'won', 'lost', 'sets', 'points'],
};

function cellValue(column: StandingColumn, row: StandingRow): string {
  switch (column) {
    case 'played':
      return String(row.played);
    case 'won':
      return String(row.won);
    case 'drawn':
      return String(row.drawn);
    case 'lost':
      return String(row.lost);
    case 'diffGoals':
    case 'diffPoints':
      return row.diff > 0 ? `+${row.diff}` : String(row.diff);
    case 'sets':
      return `${row.scoreFor}-${row.scoreAgainst}`;
    case 'points':
      return String(row.points);
  }
}

export function StandingsTable({
  sport,
  rows,
  labels,
}: {
  sport: TournamentSport;
  rows: StandingRow[];
  labels: StandingsLabels;
}) {
  const columns = COLUMNS[sport];
  const started = rows.some((row) => row.played > 0);

  return (
    <div className="rounded-xl border-[0.5px] border-border bg-card px-1.5">
      <table className="w-full table-fixed text-sm">
        <caption className="sr-only">{labels.title}</caption>
        <colgroup>
          <col className="w-8" />
          <col />
          {columns.map((column) => (
            <col key={column} className={column === 'sets' ? 'w-14' : 'w-9'} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b-[0.5px] border-border text-xs text-muted-foreground">
            <th
              scope="col"
              title={labels.rank.full}
              className="py-2 text-center font-medium"
            >
              {labels.rank.short}
            </th>
            <th scope="col" className="py-2 pl-2 text-left font-medium">
              {labels.team}
            </th>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                title={labels.columns[column].full}
                className="px-0.5 py-2 text-center font-medium"
              >
                {labels.columns[column].short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.teamId}
              className={`border-b-[0.5px] border-border last:border-b-0 ${
                started && index === 0 ? 'bg-accent' : ''
              }`}
            >
              <td className="py-2.5 text-center text-muted-foreground tabular-nums">
                {index + 1}
              </td>
              <td className="truncate py-2.5 pl-2 font-medium">{row.name}</td>
              {columns.map((column) => (
                <td
                  key={column}
                  className={`px-0.5 py-2.5 text-center tabular-nums ${
                    column === 'points' ? 'font-medium' : ''
                  }`}
                >
                  {cellValue(column, row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
