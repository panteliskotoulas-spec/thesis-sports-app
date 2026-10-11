import { TeamsGrid } from './TeamsGrid';

export function TeamCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-3 rounded-xl border-[0.5px] border-border bg-card p-4"
    >
      <div className="flex items-center gap-3">
        <div className="size-12 animate-pulse rounded-full bg-muted" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-4 w-3/4 animate-pulse rounded-sm bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded-sm bg-muted" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
        <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="mt-2 h-4 w-1/3 animate-pulse rounded-sm bg-muted" />
    </div>
  );
}

export function TeamsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <TeamsGrid>
      {Array.from({ length: count }, (_, index) => (
        <TeamCardSkeleton key={index} />
      ))}
    </TeamsGrid>
  );
}
