'use client';

import type { KeyboardEvent } from 'react';
import { Check, ExternalLink } from 'lucide-react';
import { buildMapsUrl } from '@/lib/fields/detail-format';
import {
  ADDRESS_MAX,
  COORDINATES_MAX,
  type GeocodeResult,
} from '@/lib/fields/new-field';

export interface FieldLocationInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onSelect: (result: GeocodeResult) => void;
  pending: boolean;
  results: GeocodeResult[];
  selected: GeocodeResult | null;
  notFound: boolean;
  error?: string;
  coordinates: string;
  onCoordinatesChange: (value: string) => void;
  coordinatesError?: string;
  usingCoordinates: boolean;
  labels: {
    address: string;
    hint: string;
    coordinates: string;
    coordinatesPlaceholder: string;
    coordinatesHint: string;
    find: string;
    finding: string;
    found: string;
    pick: string;
    notFound: string;
    openMaps: string;
    attribution: string;
  };
}

const MIN_QUERY_LENGTH = 3;

export function FieldLocationInput({
  value,
  onChange,
  onSearch,
  onSelect,
  pending,
  results,
  selected,
  notFound,
  error,
  coordinates,
  onCoordinatesChange,
  coordinatesError,
  usingCoordinates,
  labels,
}: FieldLocationInputProps) {
  const canSearch = value.trim().length >= MIN_QUERY_LENGTH && !pending;
  const message = notFound && !usingCoordinates ? labels.notFound : error;
  const choosing = !usingCoordinates && results.length > 1;

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (canSearch) onSearch();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="address">{labels.address}</label>

      <div className="flex gap-2">
        <input
          id="address"
          name="address"
          type="text"
          value={value}
          maxLength={ADDRESS_MAX}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? 'address-message' : 'address-hint'}
          className="h-11 min-w-0 flex-1 rounded-md border-[0.5px] border-input bg-background px-4 text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30"
        />
        <button
          type="button"
          onClick={onSearch}
          disabled={!canSearch}
          className="h-11 shrink-0 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? labels.finding : labels.find}
        </button>
      </div>

      <p id="address-hint" className="text-xs text-muted-foreground">
        {labels.hint}
      </p>

      {message ? (
        <p
          id="address-message"
          role="alert"
          className="text-xs text-destructive"
        >
          {message}
        </p>
      ) : null}

      <div aria-live="polite" className="flex flex-col gap-2">
        {choosing ? (
          <div
            role="radiogroup"
            aria-label={labels.pick}
            className="mt-1 flex flex-col gap-2"
          >
            <p className="text-sm font-medium text-foreground">{labels.pick}</p>
            {results.map((result) => {
              const active =
                selected?.latitude === result.latitude &&
                selected?.longitude === result.longitude;
              return (
                <button
                  key={`${result.latitude},${result.longitude}`}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onSelect(result)}
                  className={`flex items-start gap-2 rounded-xl border-[0.5px] p-3 text-left text-sm hover:bg-secondary ${
                    active
                      ? 'border-primary bg-accent text-accent-foreground'
                      : 'border-border bg-card text-foreground'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-[0.5px] ${
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border'
                    }`}
                  >
                    {active ? <Check className="size-3" /> : null}
                  </span>
                  <span className="min-w-0">{result.label}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {selected && !choosing ? (
          <div className="mt-1 rounded-xl bg-accent p-3 text-sm text-accent-foreground">
            <p className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {labels.found}: {selected.label}
              </span>
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-6 text-xs">
              <span>
                {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
              </span>
              <a
                href={buildMapsUrl(selected.latitude, selected.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline"
              >
                {labels.openMaps}
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            </p>
          </div>
        ) : null}

        {selected && choosing ? (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>
              {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
            </span>
            <a
              href={buildMapsUrl(selected.latitude, selected.longitude)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline"
            >
              {labels.openMaps}
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </p>
        ) : null}
      </div>

      <div className="mt-2 flex flex-col gap-1.5">
        <label htmlFor="coordinates">{labels.coordinates}</label>
        <input
          id="coordinates"
          name="coordinates"
          type="text"
          inputMode="decimal"
          value={coordinates}
          maxLength={COORDINATES_MAX}
          autoComplete="off"
          placeholder={labels.coordinatesPlaceholder}
          onChange={(event) => onCoordinatesChange(event.target.value)}
          aria-invalid={coordinatesError ? true : undefined}
          aria-describedby={
            coordinatesError ? 'coordinates-error' : 'coordinates-hint'
          }
          className="h-11 w-full rounded-md border-[0.5px] border-input bg-background px-4 text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30"
        />
        {coordinatesError ? (
          <p
            id="coordinates-error"
            role="alert"
            className="text-xs text-destructive"
          >
            {coordinatesError}
          </p>
        ) : (
          <p id="coordinates-hint" className="text-xs text-muted-foreground">
            {labels.coordinatesHint}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{labels.attribution}</p>
    </div>
  );
}
