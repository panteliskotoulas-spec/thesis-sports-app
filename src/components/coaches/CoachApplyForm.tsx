'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { chipBase, chipOff, chipOn } from '@/components/fields/chipStyles';
import { NewFieldSection } from '@/components/fields/new/NewFieldSection';
import { FormField } from '@/components/shared/FormField';
import { FormTextArea } from '@/components/shared/FormTextArea';
import { fillTemplate } from '@/lib/bookings/booking';
import {
  COACH_AREA_MAX,
  COACH_BIO_MAX,
  COACH_CERTIFICATIONS_MAX,
  COACH_RATE_MAX,
  COACH_RATE_MIN,
  parseHourlyRate,
  type CoachFormErrorKey,
  type CoachFormErrors,
  type CoachFormInitial,
} from '@/lib/coaches/coach';
import { saveCoachProfile } from '@/lib/coaches/coach-api';
import type { SportType } from '@/lib/fields/types';

export interface CoachApplyFormLabels {
  sectionTitle: string;
  sport: string;
  area: string;
  areaPlaceholder: string;
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
  lng: string;
  initial?: CoachFormInitial;
  sports: { value: SportType; label: string }[];
  labels: CoachApplyFormLabels;
}

export function CoachApplyForm({
  lng,
  initial,
  sports,
  labels,
}: CoachApplyFormProps) {
  const router = useRouter();

  const [sportType, setSportType] = useState<SportType | null>(
    initial?.sportType ?? null,
  );
  const [area, setArea] = useState(initial?.area ?? '');
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
    if (!area.trim()) next.area = labels.errorRequired;
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

    const result = await saveCoachProfile(
      {
        sportType,
        area: area.trim(),
        bio: bio.trim(),
        hourlyRate,
        certifications: certifications.trim(),
      },
      lng,
    );

    if (result === 'ok') {
      setSaved(true);
      router.refresh();
    } else {
      setFormError(labels.errorGeneric);
    }
    setPending(false);
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
          maxLength={COACH_AREA_MAX}
          autoComplete="off"
          hint={labels.translationHint}
          error={errors.area}
        />

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
