'use client';

import type { KeyboardEvent } from 'react';
import { Check, ExternalLink } from 'lucide-react';
import { buildMapsUrl } from '@/lib/fields/detail-format';
import { ADDRESS_MAX, type GeocodeResult } from '@/lib/fields/new-field';

export interface FieldLocationInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  pending: boolean;
  result: GeocodeResult | null;
  notFound: boolean;
  error?: string;
  labels: {
    address: string;
    find: string;
    finding: string;
    found: string;
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
  pending,
  result,
  notFound,
  error,
  labels,
}: FieldLocationInputProps) {
  const canSearch = value.trim().length >= MIN_QUERY_LENGTH && !pending;
  const message = notFound ? labels.notFound : error;

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
          aria-describedby={message ? 'address-message' : undefined}
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

      {message ? (
        <p
          id="address-message"
          role="alert"
          className="text-xs text-destructive"
        >
          {message}
        </p>
      ) : null}

      <div aria-live="polite">
        {result ? (
          <div className="mt-1 rounded-xl bg-accent p-3 text-sm text-accent-foreground">
            <p className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {labels.found}: {result.label}
              </span>
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-6 text-xs">
              <span>
                {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
              </span>
              <a
                href={buildMapsUrl(result.latitude, result.longitude)}
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
      </div>

      <p className="text-xs text-muted-foreground">{labels.attribution}</p>
    </div>
  );
}
