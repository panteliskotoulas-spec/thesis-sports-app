'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { chipBase, chipOff, chipOn } from '@/components/fields/chipStyles';
import type {
  OwnerBookingItem,
  OwnerCancelResult,
  OwnerFieldFilter,
} from '@/lib/bookings/owner-booking';
import { cancelOwnerBooking } from '@/lib/bookings/owner-booking-api';
import {
  OwnerBookingCard,
  type OwnerBookingCardLabels,
} from './OwnerBookingCard';

export interface OwnerBookingsListLabels {
  filterAll: string;
  filterLabel: string;
  tabUpcoming: string;
  tabPast: string;
  emptyUpcomingTitle: string;
  emptyUpcomingDescription: string;
  emptyPastTitle: string;
  emptyPastDescription: string;
  cancelledNotice: string;
  card: OwnerBookingCardLabels;
}

export interface OwnerBookingsListProps {
  upcoming: OwnerBookingItem[];
  past: OwnerBookingItem[];
  fields: OwnerFieldFilter[];
  initialFieldId: string | null;
  labels: OwnerBookingsListLabels;
}

type Tab = 'upcoming' | 'past';

export function OwnerBookingsList({
  upcoming,
  past,
  fields,
  initialFieldId,
  labels,
}: OwnerBookingsListProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [fieldId, setFieldId] = useState<string | null>(initialFieldId);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleCancel(id: string): Promise<OwnerCancelResult> {
    const result = await cancelOwnerBooking(id);

    if (result.status === 'ok') {
      setNotice(labels.cancelledNotice);
      router.refresh();
    }

    return result;
  }

  const source = tab === 'upcoming' ? upcoming : past;
  const items = fieldId
    ? source.filter((item) => item.fieldId === fieldId)
    : source;

  return (
    <div className="flex flex-col gap-4">
      {fields.length > 1 ? (
        <div
          role="group"
          aria-label={labels.filterLabel}
          className="flex flex-wrap gap-2"
        >
          <button
            type="button"
            aria-pressed={fieldId === null}
            onClick={() => setFieldId(null)}
            className={`${chipBase} ${fieldId === null ? chipOn : chipOff}`}
          >
            {labels.filterAll}
          </button>
          {fields.map((field) => (
            <button
              key={field.id}
              type="button"
              aria-pressed={fieldId === field.id}
              onClick={() => setFieldId(field.id)}
              className={`${chipBase} ${fieldId === field.id ? chipOn : chipOff}`}
            >
              {field.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          aria-pressed={tab === 'upcoming'}
          onClick={() => setTab('upcoming')}
          className={`${chipBase} flex-1 ${tab === 'upcoming' ? chipOn : chipOff}`}
        >
          {labels.tabUpcoming}
        </button>
        <button
          type="button"
          aria-pressed={tab === 'past'}
          onClick={() => setTab('past')}
          className={`${chipBase} flex-1 ${tab === 'past' ? chipOn : chipOff}`}
        >
          {labels.tabPast}
        </button>
      </div>

      {notice ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl bg-accent p-3 text-sm text-accent-foreground"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {notice}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-xl border-[0.5px] border-border bg-card p-6 text-center">
          <h2 className="text-lg">
            {tab === 'upcoming'
              ? labels.emptyUpcomingTitle
              : labels.emptyPastTitle}
          </h2>
          <p className="mt-1 text-muted-foreground">
            {tab === 'upcoming'
              ? labels.emptyUpcomingDescription
              : labels.emptyPastDescription}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <OwnerBookingCard
              key={item.id}
              item={item}
              labels={labels.card}
              onCancel={handleCancel}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
