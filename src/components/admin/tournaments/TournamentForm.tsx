'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { chipBase, chipOff, chipOn } from '@/components/fields/chipStyles';
import { FormField } from '@/components/shared/FormField';
import { FormTextArea } from '@/components/shared/FormTextArea';
import {
  DESCRIPTION_MAX,
  EMPTY_FORM_VALUES,
  MAX_TEAMS,
  MIN_TEAMS,
  NAME_MAX,
  errorLabel,
  fieldsForSport,
  validateTournamentForm,
  type AdminErrorLabels,
  type FieldOption,
  type TournamentFormErrorKey,
  type TournamentFormErrors,
  type TournamentFormValues,
} from '@/lib/tournaments/admin';
import {
  createTournament,
  updateTournament,
} from '@/lib/tournaments/admin-api';
import type { TournamentSport } from '@/lib/tournaments/tournament';

export interface TournamentFormLabels {
  name: string;
  sport: string;
  sportLocked: string;
  field: string;
  fieldPlaceholder: string;
  fieldPickSport: string;
  fieldNone: string;
  startDay: string;
  endDay: string;
  maxTeams: string;
  maxTeamsHint: string;
  description: string;
  descriptionHint: string;
  submit: string;
  submitting: string;
  errorName: string;
  errorSport: string;
  errorField: string;
  errorDates: string;
  errorMaxTeams: string;
  errorDescription: string;
  errors: AdminErrorLabels;
}

export interface TournamentFormProps {
  lng: string;
  tournamentId?: string;
  initial?: TournamentFormValues;
  sports: { value: TournamentSport; label: string }[];
  fields: FieldOption[];
  labels: TournamentFormLabels;
}

const selectClass =
  'h-11 w-full rounded-md border-[0.5px] border-input bg-background px-4 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 disabled:cursor-not-allowed disabled:opacity-60';

export function TournamentForm({
  lng,
  tournamentId,
  initial,
  sports,
  fields,
  labels,
}: TournamentFormProps) {
  const router = useRouter();
  const editing = tournamentId !== undefined;

  const [values, setValues] = useState<TournamentFormValues>(
    initial ?? EMPTY_FORM_VALUES,
  );
  const [errors, setErrors] = useState<TournamentFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const availableFields = fieldsForSport(fields, values.sport);

  function clearError(...keys: TournamentFormErrorKey[]) {
    setErrors((previous) => {
      if (!keys.some((key) => previous[key])) return previous;
      const next = { ...previous };
      for (const key of keys) delete next[key];
      return next;
    });
  }

  function update<K extends keyof TournamentFormValues>(
    key: K,
    value: TournamentFormValues[K],
  ) {
    setValues((previous) => ({ ...previous, [key]: value }));
    setFormError(null);
  }

  function selectSport(sport: TournamentSport) {
    const stillValid = fieldsForSport(fields, sport).some(
      (field) => field.id === values.hostFieldId,
    );
    setValues((previous) => ({
      ...previous,
      sport,
      hostFieldId: stillValid ? previous.hostFieldId : '',
    }));
    setFormError(null);
    clearError('sport', 'hostFieldId');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const found = validateTournamentForm(values);
    setErrors(found);
    if (Object.keys(found).length > 0 || values.sport === null) return;

    setPending(true);
    setFormError(null);

    const result =
      tournamentId !== undefined
        ? await updateTournament(tournamentId, values, lng)
        : await createTournament(values, values.sport, lng);

    if (!result.ok) {
      setFormError(errorLabel(labels.errors, result.code));
      setPending(false);
      return;
    }

    router.push(`/${lng}/admin/tournaments/${tournamentId ?? result.id ?? ''}`);
    router.refresh();
  }

  const fieldPlaceholder =
    values.sport === null
      ? labels.fieldPickSport
      : availableFields.length === 0
        ? labels.fieldNone
        : labels.fieldPlaceholder;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-5 rounded-xl border-[0.5px] border-border bg-card p-4 sm:p-6"
    >
      <FormField
        id="tournament-name"
        label={labels.name}
        value={values.name}
        maxLength={NAME_MAX}
        autoComplete="off"
        error={errors.name ? labels.errorName : undefined}
        onChange={(event) => {
          update('name', event.target.value);
          clearError('name');
        }}
      />

      <div className="flex flex-col gap-1.5">
        <span id="tournament-sport-label">{labels.sport}</span>
        <div
          role="group"
          aria-labelledby="tournament-sport-label"
          className="flex flex-wrap gap-2"
        >
          {sports.map((option) => {
            const active = values.sport === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                disabled={editing}
                onClick={() => selectSport(option.value)}
                className={`${chipBase} ${active ? chipOn : chipOff} disabled:cursor-not-allowed ${
                  editing && !active ? 'opacity-50' : ''
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {editing ? (
          <p className="text-xs text-muted-foreground">{labels.sportLocked}</p>
        ) : null}
        {errors.sport ? (
          <p className="text-xs text-destructive">{labels.errorSport}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="tournament-field">{labels.field}</label>
        <select
          id="tournament-field"
          name="tournament-field"
          value={values.hostFieldId}
          disabled={availableFields.length === 0}
          aria-invalid={errors.hostFieldId ? true : undefined}
          onChange={(event) => {
            update('hostFieldId', event.target.value);
            clearError('hostFieldId');
          }}
          className={selectClass}
        >
          <option value="">{fieldPlaceholder}</option>
          {availableFields.map((field) => (
            <option key={field.id} value={field.id}>
              {field.name}
            </option>
          ))}
        </select>
        {errors.hostFieldId ? (
          <p className="text-xs text-destructive">{labels.errorField}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          id="tournament-start"
          type="date"
          label={labels.startDay}
          value={values.startDay}
          error={errors.dates ? labels.errorDates : undefined}
          onChange={(event) => {
            update('startDay', event.target.value);
            clearError('dates');
          }}
        />
        <FormField
          id="tournament-end"
          type="date"
          label={labels.endDay}
          value={values.endDay}
          min={values.startDay || undefined}
          onChange={(event) => {
            update('endDay', event.target.value);
            clearError('dates');
          }}
        />
      </div>

      <FormField
        id="tournament-max-teams"
        type="number"
        inputMode="numeric"
        label={labels.maxTeams}
        hint={labels.maxTeamsHint}
        min={MIN_TEAMS}
        max={MAX_TEAMS}
        value={values.maxTeams}
        error={errors.maxTeams ? labels.errorMaxTeams : undefined}
        onChange={(event) => {
          update('maxTeams', event.target.value);
          clearError('maxTeams');
        }}
      />

      <FormTextArea
        id="tournament-description"
        label={labels.description}
        hint={labels.descriptionHint}
        maxLength={DESCRIPTION_MAX}
        value={values.description}
        error={errors.description ? labels.errorDescription : undefined}
        onChange={(event) => {
          update('description', event.target.value);
          clearError('description');
        }}
      />

      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          aria-busy={pending}
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90 aria-busy:cursor-not-allowed aria-busy:opacity-60"
        >
          {pending ? labels.submitting : labels.submit}
        </button>
      </div>
    </form>
  );
}
