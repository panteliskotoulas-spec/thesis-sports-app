'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';

export interface FieldGalleryProps {
  images: string[];
  alt: string;
  previousLabel: string;
  nextLabel: string;
  slideLabels: string[];
}

const slideClass =
  'relative aspect-4/3 w-full shrink-0 snap-center md:aspect-2/1';
const arrowClass =
  'absolute top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border-[0.5px] border-border bg-card text-foreground hover:bg-secondary disabled:pointer-events-none disabled:opacity-40 md:flex';

export function FieldGallery({
  images,
  alt,
  previousLabel,
  nextLabel,
  slideLabels,
}: FieldGalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const [index, setIndex] = useState(0);
  const last = images.length - 1;

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  if (images.length === 0) {
    return (
      <div
        className="flex aspect-4/3 w-full items-center justify-center rounded-xl bg-accent text-accent-foreground/50 md:aspect-2/1"
        role="img"
        aria-label={alt}
      >
        <ImageIcon className="size-12" aria-hidden="true" />
      </div>
    );
  }

  function handleScroll() {
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const track = trackRef.current;
      if (!track || track.clientWidth === 0) return;
      setIndex(Math.round(track.scrollLeft / track.clientWidth));
    });
  }

  function goTo(target: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.min(Math.max(target, 0), last);
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    track.scrollTo({
      left: clamped * track.clientWidth,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(index + 1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(index - 1);
    }
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl bg-accent"
      role="region"
      aria-roledescription="carousel"
      aria-label={alt}
    >
      <div
        ref={trackRef}
        tabIndex={0}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-none focus-visible:outline-2 focus-visible:-outline-offset-2 [&::-webkit-scrollbar]:hidden"
      >
        {images.map((url, position) => (
          <div
            key={url}
            role="group"
            aria-roledescription="slide"
            aria-label={slideLabels[position]}
            className={slideClass}
          >
            <Image
              src={url}
              alt={alt}
              fill
              sizes="(min-width: 1280px) 1280px, 100vw"
              loading={position === 0 ? 'eager' : 'lazy'}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {images.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label={previousLabel}
            className={`${arrowClass} left-3`}
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index === last}
            aria-label={nextLabel}
            className={`${arrowClass} right-3`}
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>

          <span
            aria-hidden="true"
            className="absolute top-3 right-3 rounded-full bg-card px-2.5 py-1 text-xs font-medium text-foreground"
          >
            {index + 1} / {images.length}
          </span>

          <div className="absolute inset-x-0 bottom-3 flex justify-center">
            <div className="flex items-center rounded-full bg-foreground/30 px-1">
              {images.map((url, position) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => goTo(position)}
                  aria-label={slideLabels[position]}
                  aria-current={position === index}
                  className="flex size-6 items-center justify-center"
                >
                  <span
                    className={`size-2 rounded-full ${
                      position === index ? 'bg-card' : 'bg-card/50'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
