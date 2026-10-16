'use client';

import { useState, type FormEvent } from 'react';
import { chipBase, chipOff, chipOn } from '@/components/fields/chipStyles';
import { FormField } from '@/components/shared/FormField';
import { FormTextArea } from '@/components/shared/FormTextArea';
import {
  DESCRIPTION_MAX,
  EMPTY_FORM_VALUES,
  MAX_TEAMS,
  MIN_TEAMS,
  NAME_MAX,
  fieldsForSport,
  validateTournamentForm,
  type FieldOption,
  type TournamentFormErrorKey,
  type TournamentFormErrors,
  type TournamentFormValues,
} from '@/lib/tournaments/admin';
import type { TournamentSport } from '@/lib/tournaments/tournament';

export interface TournamentFormLabels {
  name: string;
  sport: string;
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
  errorName: string;
  errorSport: string;
  errorField: string;
  errorDates: string;
  errorMaxTeams: string;
  errorDescription: string;
}

export interface TournamentFormProps {
  sports: { value: TournamentSport; label: string }[];
  fields: FieldOption[];
  labels: TournamentFormLabels;
}

const selectClass =
  'h-11 w-full rounded-md border-[0.5px] border-input bg-background px-4 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 disabled:cursor-not-allowed disabled:opacity-60';

export function TournamentForm({
  sports,
  fields,
  labels,
}: TournamentFormProps) {
  const [values, setValues] = useState<TournamentFormValues>(EMPTY_FORM_VALUES);
  const [errors, setErrors] = useState<TournamentFormErrors>({});

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
    clearError('sport', 'hostFieldId');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors(validateTournamentForm(values));
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
                onClick={() => selectSport(option.value)}
                className={`${chipBase} ${active ? chipOn : chipOff}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
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

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {labels.submit}
        </button>
      </div>
    </form>
  );
}
