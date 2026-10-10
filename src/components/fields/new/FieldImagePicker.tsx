'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { ImagePlus, Star, X } from 'lucide-react';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  type ImageItem,
} from '@/lib/fields/new-field';

interface PickedImage {
  id: string;
  item: ImageItem;
  url: string;
}

export interface FieldImagePickerProps {
  initial?: string[];
  onChange: (items: ImageItem[]) => void;
  error?: string;
  labels: {
    add: string;
    cover: string;
    makeCover: string;
    remove: string;
    photo: string;
    hint: string;
    errorType: string;
    errorSize: string;
    errorMax: string;
  };
}

const iconButton =
  'absolute inline-flex size-8 items-center justify-center rounded-full border-[0.5px] border-border bg-card text-foreground hover:bg-secondary';

function revokeIfLocal(image: PickedImage) {
  if (image.item.kind === 'new') URL.revokeObjectURL(image.url);
}

export function FieldImagePicker({
  initial,
  onChange,
  error,
  labels,
}: FieldImagePickerProps) {
  const [images, setImages] = useState<PickedImage[]>(() =>
    (initial ?? []).map((url) => ({
      id: url,
      item: { kind: 'existing', url },
      url,
    })),
  );
  const [pickError, setPickError] = useState<string | null>(null);
  const latest = useRef<PickedImage[]>([]);

  useEffect(() => {
    latest.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      latest.current.forEach(revokeIfLocal);
    };
  }, []);

  function commit(next: PickedImage[]) {
    setImages(next);
    onChange(next.map((image) => image.item));
  }

  function handleAdd(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    let problem: string | null = null;
    const accepted: PickedImage[] = [];

    for (const file of files) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        problem = labels.errorType;
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        problem = labels.errorSize;
        continue;
      }
      if (images.length + accepted.length >= MAX_IMAGES) {
        problem = labels.errorMax;
        continue;
      }
      accepted.push({
        id: crypto.randomUUID(),
        item: { kind: 'new', file },
        url: URL.createObjectURL(file),
      });
    }

    setPickError(problem);
    if (accepted.length > 0) commit([...images, ...accepted]);
  }

  function handleRemove(id: string) {
    const target = images.find((image) => image.id === id);
    if (target) revokeIfLocal(target);
    setPickError(null);
    commit(images.filter((image) => image.id !== id));
  }

  function handleMakeCover(id: string) {
    const target = images.find((image) => image.id === id);
    if (!target) return;
    commit([target, ...images.filter((image) => image.id !== id)]);
  }

  const message = pickError ?? error;

  return (
    <div className="flex flex-col gap-2">
      <ul className="grid grid-cols-3 gap-2 lg:grid-cols-6">
        {images.map((image, index) => {
          const position = `${labels.photo} ${index + 1}`;
          return (
            <li
              key={image.id}
              className="relative aspect-square overflow-hidden rounded-xl border-[0.5px] border-border bg-secondary"
            >
              <Image
                src={image.url}
                alt={position}
                fill
                unoptimized
                sizes="(min-width: 1024px) 8rem, 33vw"
                className="object-cover"
              />
              {index === 0 ? (
                <span className="absolute top-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {labels.cover}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleMakeCover(image.id)}
                  aria-label={`${labels.makeCover}: ${position}`}
                  title={labels.makeCover}
                  className={`${iconButton} top-1.5 left-1.5`}
                >
                  <Star className="size-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove(image.id)}
                aria-label={`${labels.remove}: ${position}`}
                title={labels.remove}
                className={`${iconButton} top-1.5 right-1.5`}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          );
        })}

        {images.length < MAX_IMAGES ? (
          <li>
            <label className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border-[0.5px] border-dashed border-sage-strong bg-secondary text-accent-foreground hover:bg-accent has-focus-visible:ring-2 has-focus-visible:ring-ring/50">
              <ImagePlus className="size-6" aria-hidden="true" />
              <span className="sr-only">{labels.add}</span>
              <input
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                multiple
                onChange={handleAdd}
                className="sr-only"
              />
            </label>
          </li>
        ) : null}
      </ul>

      {message ? (
        <p role="alert" className="text-xs text-destructive">
          {message}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">{labels.hint}</p>
    </div>
  );
}
