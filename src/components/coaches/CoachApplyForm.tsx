'use client';

import { useState, type FormEvent } from 'react';
import { chipBase, chipOff, chipOn } from '@/components/fields/chipStyles';
import { NewFieldSection } from '@/components/fields/new/NewFieldSection';
import { FormField } from '@/components/shared/FormField';
import { FormTextArea } from '@/components/shared/FormTextArea';
import { fillTemplate } from '@/lib/bookings/booking';
import {
  COACH_BIO_MAX,
  COACH_CERTIFICATIONS_MAX,
  COACH_RATE_MAX,
  COACH_RATE_MIN,
  parseHourlyRate,
  type CoachFormErrorKey,
  type CoachFormErrors,
  type CoachFormInitial,
} from '@/lib/coaches/coach';
import { mockSubmitCoachApplication } from '@/lib/coaches/coach-mock';
import type { SportType } from '@/lib/fields/types';

export interface CoachApplyFormLabels {
  sectionTitle: string;
  sport: string;
  bio: string;
  translationHint: string;
  rate: string;
  rateHint: string;
  certifications: string;
  certificationsPlaceholder: string;
  submit: string;
  submitting: string;
  saved: string;
  errorRequired: string;
  errorSport: string;
  errorRate: string;
  errorGeneric: string;
}

export interface CoachApplyFormProps {
  initial?: CoachFormInitial;
  sports: { value: SportType; label: string }[];
  labels: CoachApplyFormLabels;
}

export function CoachApplyForm({
  initial,
  sports,
  labels,
}: CoachApplyFormProps) {
  const [sportType, setSportType] = useState<SportType | null>(
    initial?.sportType ?? null,
  );
  const [bio, setBio] = useState(initial?.bio ?? '');
  const [rate, setRate] = useState(initial?.hourlyRate ?? '');
  const [certifications, setCertifications] = useState(
    initial?.certifications ?? '',
  );
  const [errors, setErrors] = useState<CoachFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  function clearError(key: CoachFormErrorKey) {
    setSaved(false);
    setErrors((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  }

  function validate(): CoachFormErrors {
    const next: CoachFormErrors = {};
    if (!sportType) next.sportType = labels.errorSport;
    if (!bio.trim()) next.bio = labels.errorRequired;
    if (parseHourlyRate(rate) === null) {
      next.hourlyRate = fillTemplate(labels.errorRate, {
        min: String(COACH_RATE_MIN),
        max: String(COACH_RATE_MAX),
      });
    }
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next = validate();
    setErrors(next);
    const hourlyRate = parseHourlyRate(rate);
    if (Object.keys(next).length > 0 || !sportType || hourlyRate === null) {
      return;
    }

    setPending(true);
    setFormError(null);
    setSaved(false);

    try {
      await mockSubmitCoachApplication({
        sportType,
        bio: bio.trim(),
        hourlyRate,
        certifications: certifications.trim(),
      });
      setSaved(true);
    } catch {
      setFormError(labels.errorGeneric);
    } finally {
      setPending(false);
    }
  }

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <NewFieldSection title={labels.sectionTitle}>
        <div className="flex flex-col gap-2">
          <p
            id="coach-sport-label"
            className="text-sm font-medium text-foreground"
          >
            {labels.sport}
          </p>
          <div
            role="group"
            aria-labelledby="coach-sport-label"
            className="flex flex-wrap gap-2"
          >
            {sports.map((option) => {
              const active = sportType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setSportType(option.value);
                    clearError('sportType');
                  }}
                  className={`${chipBase} ${active ? chipOn : chipOff}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {errors.sportType ? (
            <p role="alert" className="text-xs text-destructive">
              {errors.sportType}
            </p>
          ) : null}
        </div>

        <FormTextArea
          id="bio"
          label={labels.bio}
          value={bio}
          onChange={(event) => {
            setBio(event.target.value);
            clearError('bio');
          }}
          maxLength={COACH_BIO_MAX}
          hint={labels.translationHint}
          error={errors.bio}
        />

        <FormField
          id="hourlyRate"
          type="text"
          inputMode="decimal"
          label={labels.rate}
          value={rate}
          onChange={(event) => {
            setRate(event.target.value);
            clearError('hourlyRate');
          }}
          autoComplete="off"
          hint={labels.rateHint}
          error={errors.hourlyRate}
        />

        <FormField
          id="certifications"
          type="text"
          label={labels.certifications}
          placeholder={labels.certificationsPlaceholder}
          value={certifications}
          onChange={(event) => {
            setCertifications(event.target.value);
            setSaved(false);
          }}
          maxLength={COACH_CERTIFICATIONS_MAX}
          autoComplete="off"
        />
      </NewFieldSection>

      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      {saved ? (
        <p role="status" className="text-sm text-foreground">
          {labels.saved}
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
