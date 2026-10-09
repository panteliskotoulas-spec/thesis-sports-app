'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { FieldFilters, FieldTypeFilter } from '@/lib/fields/filters';
import type { SportType } from '@/lib/fields/types';
import { chipBase, chipOff, chipOn } from './chipStyles';
import type { FieldsFiltersLabels } from './FieldsFilters';
import { useApplyFilters } from './useApplyFilters';

export interface FieldsFilterSheetProps {
  filters: FieldFilters;
  today: string;
  tomorrow: string;
  sports: { value: SportType; label: string }[];
  labels: FieldsFiltersLabels;
  activeCount: number;
}

type Draft = Pick<FieldFilters, 'type' | 'sport' | 'date'>;

function toDraft(filters: FieldFilters): Draft {
  return { type: filters.type, sport: filters.sport, date: filters.date };
}

export function FieldsFilterSheet({
  filters,
  today,
  tomorrow,
  sports,
  labels,
  activeCount,
}: FieldsFilterSheetProps) {
  const apply = useApplyFilters();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(toDraft(filters));

  const types: { value: FieldTypeFilter | null; label: string }[] = [
    { value: null, label: labels.typeAll },
    { value: 'outdoor', label: labels.typeOutdoor },
    { value: 'indoor', label: labels.typeIndoor },
  ];

  function handleOpenChange(next: boolean) {
    if (next) setDraft(toDraft(filters));
    setOpen(next);
  }

  function patch(change: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...change }));
  }

  function handleApply() {
    apply({ ...filters, ...draft });
    setOpen(false);
  }

  function handleReset() {
    setDraft({ type: null, sport: null, date: null });
  }

  const shortcuts = [
    { value: today, label: labels.today },
    { value: tomorrow, label: labels.tomorrow },
  ];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary md:hidden"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          {labels.filtersButton}
          {activeCount > 0 ? (
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" closeLabel={labels.close} className="gap-0">
        <SheetHeader>
          <SheetTitle>{labels.sheetTitle}</SheetTitle>
          <SheetDescription className="sr-only">
            {labels.sheetDescription}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-6">
          <section>
            <p className="mb-2 text-sm font-medium text-foreground">
              {labels.date}
            </p>
            <div className="mb-2 flex gap-2">
              {shortcuts.map((shortcut) => {
                const active = draft.date === shortcut.value;
                return (
                  <button
                    key={shortcut.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      patch({ date: active ? null : shortcut.value })
                    }
                    className={`${chipBase} ${active ? chipOn : chipOff}`}
                  >
                    {shortcut.label}
                  </button>
                );
              })}
            </div>
            <input
              type="date"
              aria-label={labels.date}
              min={today}
              value={draft.date ?? ''}
              onChange={(event) => patch({ date: event.target.value || null })}
              className="h-11 w-full rounded-md border-[0.5px] border-input bg-card px-3.5 text-sm text-foreground"
            />
          </section>

          <section>
            <p className="mb-2 text-sm font-medium text-foreground">
              {labels.sportLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={draft.sport === null}
                onClick={() => patch({ sport: null })}
                className={`${chipBase} ${draft.sport === null ? chipOn : chipOff}`}
              >
                {labels.sportAll}
              </button>
              {sports.map((option) => {
                const active = draft.sport === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => patch({ sport: option.value })}
                    className={`${chipBase} ${active ? chipOn : chipOff}`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <p className="mb-2 text-sm font-medium text-foreground">
              {labels.typeLabel}
            </p>
            <div
              role="group"
              aria-label={labels.typeLabel}
              className="flex gap-1 rounded-full border-[0.5px] border-border bg-card p-1"
            >
              {types.map((option) => {
                const active = draft.type === option.value;
                return (
                  <button
                    key={option.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => patch({ type: option.value })}
                    className={`h-10 flex-1 rounded-full px-4 text-sm font-medium ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-secondary'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <SheetFooter className="flex-row gap-3 border-t-[0.5px] border-border bg-popover pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleReset}
            className="h-11 flex-1 rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary"
          >
            {labels.reset}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="h-11 flex-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {labels.apply}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
