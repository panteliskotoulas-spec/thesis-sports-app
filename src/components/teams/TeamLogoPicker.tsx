'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { ImagePlus, X } from 'lucide-react';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@/lib/fields/new-field';
import { teamInitials, type LogoItem } from '@/lib/teams/team';

interface PickedLogo {
  item: LogoItem;
  url: string;
}

export interface TeamLogoPickerProps {
  name: string;
  initial?: string | null;
  onChange: (item: LogoItem | null) => void;
  labels: {
    add: string;
    change: string;
    remove: string;
    hint: string;
    errorType: string;
    errorSize: string;
  };
}

function revokeIfLocal(logo: PickedLogo | null) {
  if (logo && logo.item.kind === 'new') URL.revokeObjectURL(logo.url);
}

export function TeamLogoPicker({
  name,
  initial,
  onChange,
  labels,
}: TeamLogoPickerProps) {
  const [picked, setPicked] = useState<PickedLogo | null>(
    initial ? { item: { kind: 'existing', url: initial }, url: initial } : null,
  );
  const [error, setError] = useState<string | null>(null);
  const latest = useRef<PickedLogo | null>(null);

  useEffect(() => {
    latest.current = picked;
  }, [picked]);

  useEffect(() => {
    return () => {
      revokeIfLocal(latest.current);
    };
  }, []);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError(labels.errorType);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(labels.errorSize);
      return;
    }

    revokeIfLocal(picked);
    setError(null);
    setPicked({
      item: { kind: 'new', file },
      url: URL.createObjectURL(file),
    });
    onChange({ kind: 'new', file });
  }

  function handleRemove() {
    revokeIfLocal(picked);
    setError(null);
    setPicked(null);
    onChange(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <span className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-2xl font-medium text-accent-foreground">
          {picked ? (
            <Image
              src={picked.url}
              alt=""
              fill
              unoptimized
              sizes="80px"
              className="object-cover"
            />
          ) : teamInitials(name) ? (
            teamInitials(name)
          ) : (
            <ImagePlus className="size-6" aria-hidden="true" />
          )}
        </span>

        <div className="flex flex-wrap gap-2">
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary has-focus-visible:ring-2 has-focus-visible:ring-ring/50">
            <ImagePlus className="size-4" aria-hidden="true" />
            {picked ? labels.change : labels.add}
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={handleChange}
              className="sr-only"
            />
          </label>
          {picked ? (
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex h-10 items-center gap-2 rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary"
            >
              <X className="size-4" aria-hidden="true" />
              {labels.remove}
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">{labels.hint}</p>
    </div>
  );
}
