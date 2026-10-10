'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { chipBase, chipOff, chipOn } from '@/components/fields/chipStyles';
import type {
  BookingItem,
  CancelBookingResult,
  CompensationValue,
} from '@/lib/bookings/booking';
import { cancelBooking } from '@/lib/bookings/booking-api';
import { BookingCard, type BookingCardLabels } from './BookingCard';

export interface BookingsListLabels {
  tabUpcoming: string;
  tabPast: string;
  emptyUpcomingTitle: string;
  emptyUpcomingDescription: string;
  emptyUpcomingAction: string;
  emptyPastTitle: string;
  emptyPastDescription: string;
  bookedNotice: string;
  cancelledNotice: string;
  card: BookingCardLabels;
}

export interface BookingsListProps {
  upcoming: BookingItem[];
  past: BookingItem[];
  browseHref: string;
  justBooked: boolean;
  labels: BookingsListLabels;
}

type Tab = 'upcoming' | 'past';

export function BookingsList({
  upcoming,
  past,
  browseHref,
  justBooked,
  labels,
}: BookingsListProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [notice, setNotice] = useState<string | null>(
    justBooked ? labels.bookedNotice : null,
  );

  async function handleCancel(
    id: string,
    compensation: CompensationValue,
  ): Promise<CancelBookingResult> {
    const result = await cancelBooking({ reservationId: id, compensation });

    if (result.status === 'ok') {
      setNotice(labels.cancelledNotice);
      router.refresh();
    }

    return result;
  }

  const items = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="flex flex-col gap-4">
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
          {tab === 'upcoming' ? (
            <Link
              href={browseHref}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
              {labels.emptyUpcomingAction}
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <BookingCard
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
