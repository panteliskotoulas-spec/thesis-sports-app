import Image from 'next/image';
import Link from 'next/link';
import { ImageIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface EntityCardProps {
  href: string;
  title: string;
  imageUrl: string | null;
  dimImage?: boolean;
  badge?: ReactNode;
  aside?: ReactNode;
  meta?: ReactNode;
  tags?: ReactNode;
  footer?: ReactNode;
}

export function EntityCard({
  href,
  title,
  imageUrl,
  dimImage = false,
  badge,
  aside,
  meta,
  tags,
  footer,
}: EntityCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border-[0.5px] border-border bg-card">
      <Link
        href={href}
        className="flex flex-1 flex-col focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        <div className="relative aspect-4/3 overflow-hidden bg-accent">
          <div
            className={`absolute inset-0 ${dimImage ? 'opacity-45 grayscale-50' : ''}`}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt=""
                fill
                sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-accent-foreground/50">
                <ImageIcon className="size-10" aria-hidden="true" />
              </div>
            )}
          </div>
          {badge ? <div className="absolute left-3 top-3">{badge}</div> : null}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base">{title}</h3>
            {aside}
          </div>
          {meta}
          {tags}
          {footer ? (
            <div className="mt-auto border-t-[0.5px] border-border pt-3">
              {footer}
            </div>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
