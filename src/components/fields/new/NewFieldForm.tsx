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
  parseCoordinates,
  type GeocodeResult,
  type ImageItem,
  type NewFieldErrorKey,
  type NewFieldErrors,
} from '@/lib/fields/new-field';
import {
  geocodeAddress,
  submitNewField,
  updateExistingField,
} from '@/lib/fields/new-field-api';
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

export interface NewFieldInitialValues {
  id: string;
  name: string;
  description: string;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  indoor: boolean;
  sports: SportType[];
  images: string[];
}

export interface NewFieldFormProps {
  lng: string;
  initial?: NewFieldInitialValues;
  notice?: string;
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
    errorCoordinates: string;
    errorSports: string;
    errorImages: string;
    errorGeneric: string;
    location: FieldLocationInputProps['labels'];
    photos: FieldImagePickerProps['labels'];
  };
}

export function NewFieldForm({
  lng,
  initial,
  notice,
  sports,
  labels,
}: NewFieldFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [area, setArea] = useState(initial?.area ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [location, setLocation] = useState<GeocodeResult | null>(
    initial
      ? {
          label: initial.address,
          latitude: initial.latitude,
          longitude: initial.longitude,
        }
      : null,
  );
  const [coordinates, setCoordinates] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [indoor, setIndoor] = useState(initial?.indoor ?? false);
  const [selectedSports, setSelectedSports] = useState<SportType[]>(
    initial?.sports ?? [],
  );
  const [images, setImages] = useState<ImageItem[]>(
    () => initial?.images.map((url) => ({ kind: 'existing', url })) ?? [],
  );
  const [errors, setErrors] = useState<NewFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const typedCoordinates = coordinates.trim()
    ? parseCoordinates(coordinates)
    : null;
  const effectiveLocation: GeocodeResult | null = typedCoordinates
    ? { label: address.trim(), ...typedCoordinates }
    : location;

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
    setResults([]);
    setNotFound(false);
    clearError('address');
  }

  function handleCoordinatesChange(value: string) {
    setCoordinates(value);
    clearError('coordinates');
    clearError('address');
  }

  function handleSelect(result: GeocodeResult) {
    setLocation(result);
    clearError('address');
  }

  async function handleSearch() {
    const query = address.trim();
    if (query.length < 3) return;

    setSearching(true);
    setNotFound(false);
    clearError('address');

    try {
      const found = await geocodeAddress(query, lng);
      setResults(found);
      setLocation(found.length === 1 ? found[0] : null);
      setNotFound(found.length === 0);
    } catch {
      setResults([]);
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

  function handleImagesChange(next: ImageItem[]) {
    setImages(next);
    clearError('images');
  }

  function validate(): NewFieldErrors {
    const next: NewFieldErrors = {};
    if (!name.trim()) next.name = labels.errorRequired;
    if (!description.trim()) next.description = labels.errorRequired;
    if (!area.trim()) next.area = labels.errorRequired;
    if (coordinates.trim() && !typedCoordinates) {
      next.coordinates = labels.errorCoordinates;
    }
    if (!address.trim()) next.address = labels.errorRequired;
    else if (!effectiveLocation) next.address = labels.errorLocation;
    if (selectedSports.length === 0) next.sports = labels.errorSports;
    if (images.length === 0) next.images = labels.errorImages;
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0 || !effectiveLocation) return;

    setPending(true);
    setFormError(null);

    try {
      const values = {
        name: name.trim(),
        description: description.trim(),
        area: area.trim(),
        address: address.trim(),
        latitude: effectiveLocation.latitude,
        longitude: effectiveLocation.longitude,
        indoor,
        sports: sports
          .map((option) => option.value)
          .filter((value) => selectedSports.includes(value)),
        images,
      };

      if (initial) await updateExistingField(initial.id, values, lng);
      else await submitNewField(values, lng);

      router.push(`/${lng}/owner/fields`);
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
      {notice ? (
        <p className="rounded-xl bg-secondary px-4 py-3 text-sm text-foreground">
          {notice}
        </p>
      ) : null}

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
              onSelect={handleSelect}
              pending={searching}
              results={results}
              selected={effectiveLocation}
              notFound={notFound}
              error={errors.address}
              coordinates={coordinates}
              onCoordinatesChange={handleCoordinatesChange}
              coordinatesError={errors.coordinates}
              usingCoordinates={typedCoordinates !== null}
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
          initial={initial?.images}
          onChange={handleImagesChange}
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
        {initial ? null : (
          <p className="text-center text-xs text-muted-foreground lg:text-right">
            {labels.note}
          </p>
        )}
      </div>
    </form>
  );
}
