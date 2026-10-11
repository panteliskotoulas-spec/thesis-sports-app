import Link from 'next/link';
import { Calendar, Clock } from 'lucide-react';
import {
  TeamSplitProgress,
  type TeamSplitLabels,
} from '@/components/teams/TeamSplitProgress';
import { fillTemplate } from '@/lib/bookings/booking';
import type { TeamReservationItem } from '@/lib/teams/team-booking';

export interface TeamReservationsLabels {
  title: string;
  empty: string;
  confirmed: string;
  bookedBy: string;
  split: TeamSplitLabels;
}

export interface TeamReservationsProps {
  items: TeamReservationItem[];
  lng: string;
  teamId: string;
  labels: TeamReservationsLabels;
}

export function TeamReservations({
  items,
  lng,
  teamId,
  labels,
}: TeamReservationsProps) {
  return (
    <section className="rounded-xl border-[0.5px] border-border bg-card p-4 sm:p-5">
      <h2 className="text-lg">{labels.title}</h2>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{labels.empty}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border-[0.5px] border-border p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={item.fieldHref}
                  className="font-medium text-foreground hover:underline"
                >
                  {item.fieldName}
                </Link>
                <span className="inline-flex shrink-0 items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                  {labels.confirmed}
                </span>
              </div>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Calendar className="size-4 shrink-0" aria-hidden="true" />
                  {item.date}
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="size-4 shrink-0" aria-hidden="true" />
                  {item.time}
                </li>
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                {fillTemplate(labels.bookedBy, { name: item.bookedBy })}
              </p>
              {item.split ? (
                <TeamSplitProgress
                  split={item.split}
                  lng={lng}
                  teamId={teamId}
                  reservationId={item.id}
                  labels={labels.split}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
