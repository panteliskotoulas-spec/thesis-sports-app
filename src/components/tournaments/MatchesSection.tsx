'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { fillTemplate } from '@/lib/bookings/booking';
import type { MatchesLabels } from '@/lib/tournaments/tournament-labels';

export interface MatchCompareRow {
  id: string;
  label: string;
  home: string;
  away: string;
  homeShare: number;
  homeLeads: boolean;
  awayLeads: boolean;
}

export interface MatchRow {
  id: string;
  round: number;
  homeName: string;
  awayName: string;
  completed: boolean;
  scoreLabel: string | null;
  detailLabel: string;
  compare: MatchCompareRow[] | null;
}

interface RoundGroup {
  round: number;
  matches: MatchRow[];
}

function groupByRound(rows: MatchRow[]): RoundGroup[] {
  const groups: RoundGroup[] = [];
  for (const row of rows) {
    const current = groups[groups.length - 1];
    if (current && current.round === row.round) current.matches.push(row);
    else groups.push({ round: row.round, matches: [row] });
  }
  return groups;
}

export function MatchesSection({
  rows,
  labels,
}: {
  rows: MatchRow[];
  labels: MatchesLabels;
}) {
  const [openIds, setOpenIds] = useState<string[]>([]);

  function toggle(id: string) {
    setOpenIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  if (rows.length === 0) {
    return <p className="text-muted-foreground">{labels.empty}</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {groupByRound(rows).map((group) => (
        <div key={group.round}>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            {fillTemplate(labels.round, { n: String(group.round) })}
          </h3>
          <ul className="flex flex-col gap-2">
            {group.matches.map((row) => {
              const expandable = row.compare !== null;
              const open = openIds.includes(row.id);
              const body = (
                <>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <span className="truncate text-right font-medium">
                      {row.homeName}
                    </span>
                    <span
                      className={`min-w-16 rounded-lg px-2 py-0.5 text-center font-medium tabular-nums ${
                        row.completed
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {row.scoreLabel ?? 'vs'}
                    </span>
                    <span className="truncate font-medium">{row.awayName}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <span>{row.detailLabel}</span>
                    {expandable ? (
                      <ChevronDown
                        className={`size-4 ${open ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                </>
              );

              return (
                <li
                  key={row.id}
                  className="overflow-hidden rounded-xl border-[0.5px] border-border bg-card"
                >
                  {expandable ? (
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={`compare-${row.id}`}
                      aria-label={`${row.homeName} - ${row.awayName}: ${
                        open ? labels.compareHide : labels.compareShow
                      }`}
                      onClick={() => toggle(row.id)}
                      className="w-full px-3 py-3 text-left hover:bg-secondary/50"
                    >
                      {body}
                    </button>
                  ) : (
                    <div className="px-3 py-3">{body}</div>
                  )}
                  {expandable && open ? (
                    <div
                      id={`compare-${row.id}`}
                      className="border-t-[0.5px] border-border px-3 pb-3 pt-2"
                    >
                      {row.compare?.map((item) => (
                        <div key={item.id} className="mt-2.5 first:mt-1">
                          <div className="flex items-center justify-between text-sm tabular-nums">
                            <span
                              className={item.homeLeads ? 'font-medium' : ''}
                            >
                              {item.home}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.label}
                            </span>
                            <span
                              className={item.awayLeads ? 'font-medium' : ''}
                            >
                              {item.away}
                            </span>
                          </div>
                          <div className="mt-1 flex h-1.5 gap-0.5">
                            <div
                              className="rounded-l-full bg-primary"
                              style={{ width: `${item.homeShare}%` }}
                            />
                            <div className="flex-1 rounded-r-full bg-terracotta" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
