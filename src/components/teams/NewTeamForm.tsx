'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus } from 'lucide-react';
import { chipBase, chipOff, chipOn } from '@/components/fields/chipStyles';
import { NewFieldSection } from '@/components/fields/new/NewFieldSection';
import { FormField } from '@/components/shared/FormField';
import { FormTextArea } from '@/components/shared/FormTextArea';
import { fillTemplate } from '@/lib/bookings/booking';
import type { SportType } from '@/lib/fields/types';
import { submitNewTeam, updateExistingTeam } from '@/lib/teams/team-api';
import {
  TEAM_AREA_MAX,
  TEAM_DEFAULT_MEMBERS,
  TEAM_DESCRIPTION_MAX,
  TEAM_MAX_MEMBERS,
  TEAM_MIN_MEMBERS,
  TEAM_NAME_MAX,
  TEAM_POSITION_MAX,
  type LogoItem,
  type TeamFormErrorKey,
  type TeamFormErrors,
  type TeamFormValues,
  type TeamLevel,
} from '@/lib/teams/team';
import { TeamLogoPicker, type TeamLogoPickerProps } from './TeamLogoPicker';

export interface TeamFormInitialValues {
  id: string;
  name: string;
  sportType: SportType;
  level: TeamLevel;
  area: string;
  description: string;
  maxMembers: number;
  isRecruiting: boolean;
  neededPosition: string;
  logoUrl: string | null;
  memberCount: number;
}

export interface TeamFormLabels {
  basicTitle: string;
  membersTitle: string;
  name: string;
  sport: string;
  sportLockedHint: string;
  sportTakenHint: string;
  level: string;
  area: string;
  areaPlaceholder: string;
  translationHint: string;
  description: string;
  maxMembers: string;
  maxMembersHint: string;
  increase: string;
  decrease: string;
  recruiting: string;
  recruitingHint: string;
  neededPosition: string;
  neededPositionPlaceholder: string;
  submit: string;
  submitting: string;
  errorRequired: string;
  errorSport: string;
  errorMembers: string;
  errorGeneric: string;
  logo: TeamLogoPickerProps['labels'];
}

export interface NewTeamFormProps {
  lng: string;
  initial?: TeamFormInitialValues;
  takenSports: SportType[];
  sports: { value: SportType; label: string }[];
  levels: { value: TeamLevel; label: string }[];
  labels: TeamFormLabels;
}

const stepButton =
  'inline-flex size-11 items-center justify-center rounded-full border-[0.5px] border-border bg-card text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50';

export function NewTeamForm({
  lng,
  initial,
  takenSports,
  sports,
  levels,
  labels,
}: NewTeamFormProps) {
  const router = useRouter();

  const minMembers = Math.max(TEAM_MIN_MEMBERS, initial?.memberCount ?? 0);
  const firstFree =
    sports.find((option) => !takenSports.includes(option.value))?.value ?? null;

  const [name, setName] = useState(initial?.name ?? '');
  const [sportType, setSportType] = useState<SportType | null>(
    initial?.sportType ?? firstFree,
  );
  const [level, setLevel] = useState<TeamLevel>(
    initial?.level ?? levels[0].value,
  );
  const [area, setArea] = useState(initial?.area ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [maxMembers, setMaxMembers] = useState(
    Math.max(initial?.maxMembers ?? TEAM_DEFAULT_MEMBERS, minMembers),
  );
  const [isRecruiting, setIsRecruiting] = useState(
    initial?.isRecruiting ?? false,
  );
  const [neededPosition, setNeededPosition] = useState(
    initial?.neededPosition ?? '',
  );
  const [logo, setLogo] = useState<LogoItem | null>(
    initial?.logoUrl ? { kind: 'existing', url: initial.logoUrl } : null,
  );
  const [errors, setErrors] = useState<TeamFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function clearError(key: TeamFormErrorKey) {
    setErrors((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  }

  function changeMembers(delta: number) {
    setMaxMembers((current) =>
      Math.min(TEAM_MAX_MEMBERS, Math.max(minMembers, current + delta)),
    );
    clearError('maxMembers');
  }

  function validate(): TeamFormErrors {
    const next: TeamFormErrors = {};
    if (!name.trim()) next.name = labels.errorRequired;
    if (!sportType) next.sportType = labels.errorSport;
    if (!area.trim()) next.area = labels.errorRequired;
    if (maxMembers < minMembers || maxMembers > TEAM_MAX_MEMBERS) {
      next.maxMembers = fillTemplate(labels.errorMembers, {
        min: String(minMembers),
        max: String(TEAM_MAX_MEMBERS),
      });
    }
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0 || !sportType) return;

    setPending(true);
    setFormError(null);

    const values: TeamFormValues = {
      name: name.trim(),
      sportType,
      level,
      area: area.trim(),
      description: description.trim(),
      maxMembers,
      isRecruiting,
      neededPosition: isRecruiting ? neededPosition.trim() : '',
      logo,
    };

    try {
      if (initial) {
        await updateExistingTeam(initial.id, values, lng);
        router.push(`/${lng}/teams/${initial.id}/manage`);
      } else {
        const created = await submitNewTeam(values, lng);
        router.push(`/${lng}/teams/${created.id}`);
      }
      router.refresh();
    } catch {
      setFormError(labels.errorGeneric);
      setPending(false);
    }
  }

  const takenLabels = sports
    .filter((option) => takenSports.includes(option.value))
    .map((option) => option.label)
    .join(', ');

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <NewFieldSection title={labels.basicTitle}>
        <TeamLogoPicker
          name={name}
          initial={initial?.logoUrl}
          onChange={setLogo}
          labels={labels.logo}
        />

        <FormField
          id="name"
          type="text"
          label={labels.name}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            clearError('name');
          }}
          maxLength={TEAM_NAME_MAX}
          autoComplete="off"
          error={errors.name}
        />

        <div className="flex flex-col gap-2">
          <p id="sport-label" className="text-sm font-medium text-foreground">
            {labels.sport}
          </p>
          <div
            role="group"
            aria-labelledby="sport-label"
            className="flex flex-wrap gap-2"
          >
            {sports.map((option) => {
              const active = sportType === option.value;
              const disabled = initial
                ? option.value !== initial.sportType
                : takenSports.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  disabled={disabled || Boolean(initial)}
                  onClick={() => {
                    setSportType(option.value);
                    clearError('sportType');
                  }}
                  className={`${chipBase} ${active ? chipOn : chipOff} ${
                    disabled ? 'cursor-not-allowed opacity-50' : ''
                  } ${initial && active ? 'cursor-default' : ''}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {initial ? (
            <p className="text-xs text-muted-foreground">
              {labels.sportLockedHint}
            </p>
          ) : takenSports.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {fillTemplate(labels.sportTakenHint, { sports: takenLabels })}
            </p>
          ) : null}
          {errors.sportType ? (
            <p role="alert" className="text-xs text-destructive">
              {errors.sportType}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <p id="level-label" className="text-sm font-medium text-foreground">
            {labels.level}
          </p>
          <div
            role="group"
            aria-labelledby="level-label"
            className="flex flex-wrap gap-2"
          >
            {levels.map((option) => {
              const active = level === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setLevel(option.value)}
                  className={`${chipBase} ${active ? chipOn : chipOff}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <FormField
          id="area"
          type="text"
          label={labels.area}
          placeholder={labels.areaPlaceholder}
          value={area}
          onChange={(event) => {
            setArea(event.target.value);
            clearError('area');
          }}
          maxLength={TEAM_AREA_MAX}
          autoComplete="off"
          hint={labels.translationHint}
          error={errors.area}
        />

        <FormTextArea
          id="description"
          label={labels.description}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={TEAM_DESCRIPTION_MAX}
          hint={labels.translationHint}
        />
      </NewFieldSection>

      <NewFieldSection title={labels.membersTitle}>
        <div className="flex flex-col gap-2">
          <p id="members-label" className="text-sm font-medium text-foreground">
            {labels.maxMembers}
          </p>
          <div
            role="group"
            aria-labelledby="members-label"
            className="flex items-center gap-3"
          >
            <button
              type="button"
              aria-label={labels.decrease}
              disabled={maxMembers <= minMembers}
              onClick={() => changeMembers(-1)}
              className={stepButton}
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <output
              aria-live="polite"
              className="min-w-10 text-center text-xl font-medium"
            >
              {maxMembers}
            </output>
            <button
              type="button"
              aria-label={labels.increase}
              disabled={maxMembers >= TEAM_MAX_MEMBERS}
              onClick={() => changeMembers(1)}
              className={stepButton}
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
          {errors.maxMembers ? (
            <p role="alert" className="text-xs text-destructive">
              {errors.maxMembers}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {fillTemplate(labels.maxMembersHint, {
                min: String(minMembers),
                max: String(TEAM_MAX_MEMBERS),
              })}
            </p>
          )}
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              id="recruiting-label"
              className="text-sm font-medium text-foreground"
            >
              {labels.recruiting}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {labels.recruitingHint}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isRecruiting}
            aria-labelledby="recruiting-label"
            onClick={() => setIsRecruiting((value) => !value)}
            className={`relative h-7 w-12 shrink-0 rounded-full border-[0.5px] transition-colors ${
              isRecruiting
                ? 'border-primary bg-primary'
                : 'border-border bg-secondary'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-card transition-transform ${
                isRecruiting ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {isRecruiting ? (
          <FormField
            id="neededPosition"
            type="text"
            label={labels.neededPosition}
            placeholder={labels.neededPositionPlaceholder}
            value={neededPosition}
            onChange={(event) => setNeededPosition(event.target.value)}
            maxLength={TEAM_POSITION_MAX}
            autoComplete="off"
          />
        ) : null}
      </NewFieldSection>

      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
