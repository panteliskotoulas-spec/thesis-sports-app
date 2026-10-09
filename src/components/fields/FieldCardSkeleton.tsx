import { FieldsGrid } from './FieldsGrid';

// Ίδιο σχήμα με την κάρτα: φωτογραφία, τίτλος, περιοχή, tags, τιμή.
export function FieldCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col overflow-hidden rounded-xl border-[0.5px] border-border bg-card"
    >
      <div className="aspect-4/3 animate-pulse bg-muted" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded-sm bg-muted" />
        <div className="h-3 w-2/5 animate-pulse rounded-sm bg-muted" />
        <div className="flex gap-1.5">
          <div className="h-5 w-18 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="mt-2 h-4 w-1/3 animate-pulse rounded-sm bg-muted" />
      </div>
    </div>
  );
}

export function FieldsGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <FieldsGrid>
      {Array.from({ length: count }, (_, index) => (
        <FieldCardSkeleton key={index} />
      ))}
    </FieldsGrid>
  );
}
