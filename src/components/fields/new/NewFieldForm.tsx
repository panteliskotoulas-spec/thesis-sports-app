'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { chipBase, chipOff, chipOn } from '@/components/fields/chipStyles';
import { FormField } from '@/components/shared/FormField';
import { FormTextArea } from '@/components/shared/FormTextArea';
import {
  AREA_MAX,
  DESCRIPTION_MAX,
  NAME_MAX,
  type GeocodeResult,
  type NewFieldErrorKey,
  type NewFieldErrors,
} from '@/lib/fields/new-field';
import { geocodeAddress, submitNewField } from '@/lib/fields/new-field-api';
import type { SportType } from '@/lib/fields/types';
import {
  FieldImagePicker,
  type FieldImagePickerProps,
} from './FieldImagePicker';
import {
  FieldLocationInput,
  type FieldLocationInputProps,
} from './FieldLocationInput';
import { NewFieldSection } from './NewFieldSection';

export interface NewFieldFormProps {
  lng: string;
  sports: { value: SportType; label: string }[];
  labels: {
    basicTitle: string;
    name: string;
    description: string;
    area: string;
    areaPlaceholder: string;
    locationTitle: string;
    featuresTitle: string;
    type: string;
    indoor: string;
    outdoor: string;
    sports: string;
    photosTitle: string;
    submit: string;
    submitting: string;
    note: string;
    errorRequired: string;
    errorLocation: string;
    errorSports: string;
    errorImages: string;
    errorGeneric: string;
    location: FieldLocationInputProps['labels'];
    photos: FieldImagePickerProps['labels'];
  };
}

export function NewFieldForm({ lng, sports, labels }: NewFieldFormProps) {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<GeocodeResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [indoor, setIndoor] = useState(false);
  const [selectedSports, setSelectedSports] = useState<SportType[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<NewFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function clearError(key: NewFieldErrorKey) {
    setErrors((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  }

  function handleAddressChange(value: string) {
    setAddress(value);
    setLocation(null);
    setNotFound(false);
    clearError('address');
  }

  async function handleSearch() {
    const query = address.trim();
    if (query.length < 3) return;

    setSearching(true);
    setNotFound(false);
    clearError('address');

    try {
      const result = await geocodeAddress(query);
      setLocation(result);
      setNotFound(result === null);
    } catch {
      setLocation(null);
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  }

  function toggleSport(value: SportType) {
    setSelectedSports((previous) =>
      previous.includes(value)
        ? previous.filter((sport) => sport !== value)
        : [...previous, value],
    );
    clearError('sports');
  }

  function handleFilesChange(next: File[]) {
    setFiles(next);
    clearError('images');
  }

  function validate(): NewFieldErrors {
    const next: NewFieldErrors = {};
    if (!name.trim()) next.name = labels.errorRequired;
    if (!description.trim()) next.description = labels.errorRequired;
    if (!area.trim()) next.area = labels.errorRequired;
    if (!location) next.address = labels.errorLocation;
    if (selectedSports.length === 0) next.sports = labels.errorSports;
    if (files.length === 0) next.images = labels.errorImages;
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0 || !location) return;

    setPending(true);
    setFormError(null);

    try {
      const { id } = await submitNewField({
        name: name.trim(),
        description: description.trim(),
        area: area.trim(),
        address: address.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        indoor,
        sports: sports
          .map((option) => option.value)
          .filter((value) => selectedSports.includes(value)),
        images: files,
      });

      router.push(`/${lng}/fields/${id}`);
      router.refresh();
    } catch {
      setFormError(labels.errorGeneric);
      setPending(false);
    }
  }

  const typeOptions = [
    { value: false, label: labels.outdoor },
    { value: true, label: labels.indoor },
  ];

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NewFieldSection title={labels.basicTitle}>
          <FormField
            id="name"
            type="text"
            label={labels.name}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              clearError('name');
            }}
            maxLength={NAME_MAX}
            autoComplete="off"
            error={errors.name}
          />

          <FormTextArea
            id="description"
            grow
            label={labels.description}
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              clearError('description');
            }}
            maxLength={DESCRIPTION_MAX}
            error={errors.description}
          />

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
            maxLength={AREA_MAX}
            autoComplete="off"
            error={errors.area}
          />
        </NewFieldSection>

        <div className="flex min-w-0 flex-col gap-4">
          <NewFieldSection title={labels.locationTitle}>
            <FieldLocationInput
              value={address}
              onChange={handleAddressChange}
              onSearch={handleSearch}
              pending={searching}
              result={location}
              notFound={notFound}
              error={errors.address}
              labels={labels.location}
            />
          </NewFieldSection>

          <NewFieldSection title={labels.featuresTitle}>
            <div className="flex flex-col gap-2">
              <p
                id="type-label"
                className="text-sm font-medium text-foreground"
              >
                {labels.type}
              </p>
              <div
                role="group"
                aria-labelledby="type-label"
                className="flex flex-wrap gap-2"
              >
                {typeOptions.map((option) => {
                  const active = indoor === option.value;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setIndoor(option.value)}
                      className={`${chipBase} ${active ? chipOn : chipOff}`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p
                id="sports-label"
                className="text-sm font-medium text-foreground"
              >
                {labels.sports}
              </p>
              <div
                role="group"
                aria-labelledby="sports-label"
                className="flex flex-wrap gap-2"
              >
                {sports.map((option) => {
                  const active = selectedSports.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleSport(option.value)}
                      className={`${chipBase} ${active ? chipOn : chipOff}`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              {errors.sports ? (
                <p role="alert" className="text-xs text-destructive">
                  {errors.sports}
                </p>
              ) : null}
            </div>
          </NewFieldSection>
        </div>
      </div>

      <NewFieldSection title={labels.photosTitle}>
        <FieldImagePicker
          onChange={handleFilesChange}
          error={errors.images}
          labels={labels.photos}
        />
      </NewFieldSection>

      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 lg:items-end">
        <button
          type="submit"
          disabled={pending}
          className="h-11 w-full rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
        >
          {pending ? labels.submitting : labels.submit}
        </button>
        <p className="text-center text-xs text-muted-foreground lg:text-right">
          {labels.note}
        </p>
      </div>
    </form>
  );
}
