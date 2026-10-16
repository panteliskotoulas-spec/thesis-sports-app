import Link from 'next/link';
import type { ReactNode } from 'react';

export const primaryLinkClass =
  'inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90';

export const secondaryLinkClass =
  'inline-flex h-10 items-center justify-center rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary';

export interface DashboardCardProps {
  title: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  children: ReactNode;
}

export function DashboardCard({
  title,
  href,
  linkLabel,
  className = '',
  children,
}: DashboardCardProps) {
  return (
    <section
      className={`flex flex-col rounded-xl border-[0.5px] border-border bg-card p-4 sm:p-5 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg">{title}</h2>
        {href && linkLabel ? (
          <Link
            href={href}
            className="shrink-0 text-sm font-medium text-accent-foreground hover:underline"
          >
            {linkLabel}
          </Link>
        ) : null}
      </div>
      <div className="mt-3 flex flex-1 flex-col">{children}</div>
    </section>
  );
}

export function CardMessage({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground">{children}</p>;
}

export interface CardEmptyProps {
  message: string;
  actions?: ReactNode;
}

export function CardEmpty({ message, actions }: CardEmptyProps) {
  return (
    <div className="flex flex-1 flex-col items-start justify-between gap-4">
      <p className="text-muted-foreground">{message}</p>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
