'use client';

import { useState } from 'react';
import { CalendarClock, Trash2 } from 'lucide-react';
import { chipBase, chipOff, chipOn } from '@/components/fields/chipStyles';

export interface AdminMatchRow {
  id: string;
  homeName: string;
  awayName: string;
  completed: boolean;
  scoreText: string | null;
  whenText: string | null;
  day: string;
  time: string;
}

export interface AdminRoundGroup {
  round: number;
  label: string;
  matches: AdminMatchRow[];
}

export interface AdminFixturesSectionLabels {
  title: string;
  empty: string;
  needTeams: string;
  locked: string;
  legsLabel: string;
  legsOne: string;
  legsTwo: string;
  generate: string;
  clear: string;
  clearConfirm: string;
  clearYes: string;
  clearNo: string;
  schedule: string;
  tbd: string;
  completed: string;
  dayLabel: string;
  timeLabel: string;
  save: string;
  cancel: string;
  versus: string;
}

export interface AdminFixturesSectionProps {
  groups: AdminRoundGroup[];
  canGenerate: boolean;
  canClear: boolean;
  enoughTeams: boolean;
  labels: AdminFixturesSectionLabels;
}

const inputClass =
  'h-10 rounded-md border-[0.5px] border-input bg-background px-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50';
const outlineButton =
  'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary';
const primaryButton =
  'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90';

export function AdminFixturesSection({
  groups,
  canGenerate,
  canClear,
  enoughTeams,
  labels,
}: AdminFixturesSectionProps) {
  const [legs, setLegs] = useState<1 | 2>(1);
  const [confirmClear, setConfirmClear] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');

  function openEditor(match: AdminMatchRow) {
    setEditingId(match.id);
    setDay(match.day);
    setTime(match.time);
  }

  const hasMatches = groups.length > 0;

  return (
    <section
      aria-labelledby="admin-fixtures-title"
      className="rounded-xl border-[0.5px] border-border bg-card p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="admin-fixtures-title" className="text-lg">
          {labels.title}
        </h2>
        {hasMatches && canClear && !confirmClear ? (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className={`${outlineButton} text-destructive`}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {labels.clear}
          </button>
        ) : null}
      </div>

      {confirmClear ? (
        <div
          role="alertdialog"
          aria-label={labels.clear}
          className="mt-3 flex flex-col gap-3 rounded-lg border-[0.5px] border-destructive/40 p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm">{labels.clearConfirm}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className={outlineButton}
            >
              {labels.clearNo}
            </button>
            <button
              type="button"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:opacity-90"
            >
              {labels.clearYes}
            </button>
          </div>
        </div>
      ) : null}

      {!hasMatches ? (
        canGenerate ? (
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-muted-foreground">{labels.empty}</p>
            <div
              role="group"
              aria-label={labels.legsLabel}
              className="flex flex-wrap gap-2"
            >
              {([1, 2] as const).map((value) => {
                const active = legs === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setLegs(value)}
                    className={`${chipBase} ${active ? chipOn : chipOff}`}
                  >
                    {value === 1 ? labels.legsOne : labels.legsTwo}
                  </button>
                );
              })}
            </div>
            <div>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                {labels.generate}
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-muted-foreground">
            {enoughTeams ? labels.locked : labels.needTeams}
          </p>
        )
      ) : (
        <div className="mt-4 flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.round}>
              <h3 className="text-sm font-medium text-muted-foreground">
                {group.label}
              </h3>
              <ul className="mt-2 flex flex-col">
                {group.matches.map((match) => {
                  const editing = editingId === match.id;
                  return (
                    <li
                      key={match.id}
                      className="flex flex-col gap-3 border-t-[0.5px] border-border py-3"
                    >
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <p className="min-w-40 flex-1">
                          <span>{match.homeName}</span>
                          <span className="px-1.5 text-muted-foreground">
                            {labels.versus}
                          </span>
                          <span>{match.awayName}</span>
                        </p>

                        {match.completed ? (
                          <span className="inline-flex items-center gap-2 text-sm">
                            <span className="font-medium">
                              {match.scoreText}
                            </span>
                            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                              {labels.completed}
                            </span>
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {match.whenText ?? labels.tbd}
                          </span>
                        )}

                        {match.completed && match.whenText ? (
                          <span className="text-sm text-muted-foreground">
                            {match.whenText}
                          </span>
                        ) : null}

                        <button
                          type="button"
                          onClick={() =>
                            editing ? setEditingId(null) : openEditor(match)
                          }
                          aria-expanded={editing}
                          className={outlineButton}
                        >
                          <CalendarClock
                            className="size-4"
                            aria-hidden="true"
                          />
                          {labels.schedule}
                        </button>
                      </div>

                      {editing ? (
                        <div className="flex flex-wrap items-end gap-3 rounded-lg bg-secondary/60 p-3">
                          <div className="flex flex-col gap-1">
                            <label
                              htmlFor={`match-day-${match.id}`}
                              className="text-xs text-muted-foreground"
                            >
                              {labels.dayLabel}
                            </label>
                            <input
                              id={`match-day-${match.id}`}
                              type="date"
                              value={day}
                              onChange={(event) => setDay(event.target.value)}
                              className={inputClass}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label
                              htmlFor={`match-time-${match.id}`}
                              className="text-xs text-muted-foreground"
                            >
                              {labels.timeLabel}
                            </label>
                            <input
                              id={`match-time-${match.id}`}
                              type="time"
                              value={time}
                              onChange={(event) => setTime(event.target.value)}
                              className={inputClass}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button type="button" className={primaryButton}>
                              {labels.save}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className={outlineButton}
                            >
                              {labels.cancel}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
