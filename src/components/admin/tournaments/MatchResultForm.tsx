'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus } from 'lucide-react';
import {
  ResultTeamTable,
  type ResultTeamTableLabels,
} from '@/components/admin/tournaments/ResultTeamTable';
import { fillTemplate } from '@/lib/bookings/booking';
import { errorLabel, type AdminErrorLabels } from '@/lib/tournaments/admin';
import { recordMatchResult } from '@/lib/tournaments/admin-api';
import {
  MAX_SETS,
  MIN_SETS,
  SCORE_DIGITS,
  SET_DIGITS,
  SPORT_COLUMNS,
  buildResultInput,
  digitsOnly,
  setWins,
  teamPointsSummary,
  type ResultFormState,
  type ResultPlayerRow,
} from '@/lib/tournaments/result-form';
import type { TournamentSport } from '@/lib/tournaments/tournament';

export interface MatchResultTeam {
  id: string;
  name: string;
  players: ResultPlayerRow[];
}

export interface MatchResultFormLabels {
  scoreTitle: string;
  scoreAria: string;
  setsTitle: string;
  setLabel: string;
  setAria: string;
  addSet: string;
  removeSet: string;
  setsResult: string;
  playersTitle: string;
  more: string;
  less: string;
  cancel: string;
  save: string;
  saving: string;
  table: ResultTeamTableLabels;
  errors: AdminErrorLabels;
}

export interface MatchResultFormProps {
  matchId: string;
  sport: TournamentSport;
  home: MatchResultTeam;
  away: MatchResultTeam;
  initial: ResultFormState;
  backHref: string;
  labels: MatchResultFormLabels;
}

const cardClass = 'rounded-xl border-[0.5px] border-border bg-card p-4 sm:p-6';
const scoreInputClass =
  'h-14 w-full rounded-md border-[0.5px] border-input bg-background px-3 text-center text-2xl tabular-nums text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50';
const setInputClass =
  'h-10 w-full rounded-md border-[0.5px] border-input bg-background px-3 text-center tabular-nums text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50';
const outlineButton =
  'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50';

export function MatchResultForm({
  matchId,
  sport,
  home,
  away,
  initial,
  backHref,
  labels,
}: MatchResultFormProps) {
  const [state, setState] = useState<ResultFormState>(initial);
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const columns = SPORT_COLUMNS[sport];
  const visibleColumns = showMore
    ? [...columns.main, ...columns.extra]
    : columns.main;
  const isVolleyball = sport === 'VOLLEYBALL';
  const isBasketball = sport === 'BASKETBALL';
  const wins = setWins(state.sets);

  function setScore(side: 'homeScore' | 'awayScore', value: string) {
    setState((current) => ({
      ...current,
      [side]: digitsOnly(value, SCORE_DIGITS),
    }));
  }

  function setSetPoints(index: number, side: 'home' | 'away', value: string) {
    setState((current) => ({
      ...current,
      sets: current.sets.map((set, position) =>
        position === index
          ? { ...set, [side]: digitsOnly(value, SET_DIGITS) }
          : set,
      ),
    }));
  }

  function addSet() {
    setState((current) =>
      current.sets.length >= MAX_SETS
        ? current
        : { ...current, sets: [...current.sets, { home: '', away: '' }] },
    );
  }

  function removeSet() {
    setState((current) =>
      current.sets.length <= MIN_SETS
        ? current
        : { ...current, sets: current.sets.slice(0, -1) },
    );
  }

  function togglePlayer(userId: string) {
    setState((current) => {
      const entry = current.players[userId];
      if (!entry) return current;
      return {
        ...current,
        players: {
          ...current.players,
          [userId]: { ...entry, included: !entry.included },
        },
      };
    });
  }

  function setPlayerStat(userId: string, key: string, value: string) {
    setState((current) => {
      const entry = current.players[userId];
      if (!entry) return current;
      return {
        ...current,
        players: {
          ...current.players,
          [userId]: { ...entry, stats: { ...entry.stats, [key]: value } },
        },
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const built = buildResultInput(
      sport,
      home.id,
      away.id,
      [...home.players, ...away.players],
      state,
    );
    if (!built.ok) {
      setError(errorLabel(labels.errors, built.code));
      return;
    }
    setError(null);
    setSaving(true);

    const saved = await recordMatchResult(matchId, built.result);
    if (!saved.ok) {
      setSaving(false);
      setError(errorLabel(labels.errors, saved.code));
      return;
    }

    router.push(backHref);
    router.refresh();
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
      className="flex flex-col gap-4"
    >
      {isVolleyball ? (
        <section aria-labelledby="result-sets-title" className={cardClass}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="result-sets-title" className="text-lg">
              {labels.setsTitle}
            </h2>
            <p className="text-lg font-medium tabular-nums">
              {fillTemplate(labels.setsResult, {
                home: String(wins.home),
                away: String(wins.away),
              })}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-[auto_1fr_auto_1fr] items-center gap-x-3 gap-y-2">
            <span aria-hidden="true" />
            <span className="truncate text-center text-sm text-muted-foreground">
              {home.name}
            </span>
            <span aria-hidden="true" />
            <span className="truncate text-center text-sm text-muted-foreground">
              {away.name}
            </span>
            {state.sets.map((set, index) => (
              <SetRow
                key={index}
                number={index + 1}
                homeName={home.name}
                awayName={away.name}
                home={set.home}
                away={set.away}
                labels={labels}
                onChange={(side, value) => setSetPoints(index, side, value)}
              />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addSet}
              disabled={state.sets.length >= MAX_SETS}
              className={outlineButton}
            >
              <Plus className="size-4" aria-hidden="true" />
              {labels.addSet}
            </button>
            <button
              type="button"
              onClick={removeSet}
              disabled={state.sets.length <= MIN_SETS}
              className={outlineButton}
            >
              <Minus className="size-4" aria-hidden="true" />
              {labels.removeSet}
            </button>
          </div>
        </section>
      ) : (
        <section aria-labelledby="result-score-title" className={cardClass}>
          <h2 id="result-score-title" className="text-lg">
            {labels.scoreTitle}
          </h2>
          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <div className="flex min-w-0 flex-col gap-1.5">
              <label
                htmlFor="result-home-score"
                className="truncate text-center text-sm text-muted-foreground"
              >
                {home.name}
              </label>
              <input
                id="result-home-score"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={state.homeScore}
                onChange={(event) => setScore('homeScore', event.target.value)}
                aria-label={fillTemplate(labels.scoreAria, { team: home.name })}
                className={scoreInputClass}
              />
            </div>
            <span
              aria-hidden="true"
              className="pb-3 text-2xl text-muted-foreground"
            >
              –
            </span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <label
                htmlFor="result-away-score"
                className="truncate text-center text-sm text-muted-foreground"
              >
                {away.name}
              </label>
              <input
                id="result-away-score"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={state.awayScore}
                onChange={(event) => setScore('awayScore', event.target.value)}
                aria-label={fillTemplate(labels.scoreAria, { team: away.name })}
                className={scoreInputClass}
              />
            </div>
          </div>
        </section>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg">{labels.playersTitle}</h2>
        <button
          type="button"
          aria-pressed={showMore}
          onClick={() => setShowMore((current) => !current)}
          className={outlineButton}
        >
          {showMore ? labels.less : labels.more}
        </button>
      </div>

      <ResultTeamTable
        teamName={home.name}
        rows={home.players}
        columns={visibleColumns}
        players={state.players}
        summary={
          isBasketball
            ? teamPointsSummary(home.players, state, state.homeScore)
            : null
        }
        labels={labels.table}
        onToggle={togglePlayer}
        onStat={setPlayerStat}
      />
      <ResultTeamTable
        teamName={away.name}
        rows={away.players}
        columns={visibleColumns}
        players={state.players}
        summary={
          isBasketball
            ? teamPointsSummary(away.players, state, state.awayScore)
            : null
        }
        labels={labels.table}
        onToggle={togglePlayer}
        onStat={setPlayerStat}
      />

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Link href={backHref} className={outlineButton}>
          {labels.cancel}
        </Link>
        <button
          type="submit"
          aria-busy={saving}
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90 aria-busy:cursor-not-allowed aria-busy:opacity-60"
        >
          {saving ? labels.saving : labels.save}
        </button>
      </div>
    </form>
  );
}

interface SetRowProps {
  number: number;
  homeName: string;
  awayName: string;
  home: string;
  away: string;
  labels: MatchResultFormLabels;
  onChange: (side: 'home' | 'away', value: string) => void;
}

function SetRow({
  number,
  homeName,
  awayName,
  home,
  away,
  labels,
  onChange,
}: SetRowProps) {
  return (
    <>
      <span className="text-sm text-muted-foreground">
        {fillTemplate(labels.setLabel, { n: String(number) })}
      </span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={home}
        onChange={(event) => onChange('home', event.target.value)}
        aria-label={fillTemplate(labels.setAria, {
          team: homeName,
          n: String(number),
        })}
        className={setInputClass}
      />
      <span aria-hidden="true" className="text-muted-foreground">
        –
      </span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={away}
        onChange={(event) => onChange('away', event.target.value)}
        aria-label={fillTemplate(labels.setAria, {
          team: awayName,
          n: String(number),
        })}
        className={setInputClass}
      />
    </>
  );
}
