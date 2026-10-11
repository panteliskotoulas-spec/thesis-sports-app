'use client';

import { Check } from 'lucide-react';
import { TeamAvatar } from '@/components/teams/TeamAvatar';
import { fillTemplate } from '@/lib/bookings/booking';
import type { TeamBookingOption } from '@/lib/teams/team-booking';

export interface TeamBookingLabels {
  title: string;
  me: string;
  members: string;
  note: string;
  hint: string;
}

export interface TeamBookingSelectProps {
  teams: TeamBookingOption[];
  value: string | null;
  labels: TeamBookingLabels;
  disabled?: boolean;
  onChange: (teamId: string | null) => void;
}

const optionBase =
  'flex min-h-11 w-full items-center gap-3 rounded-full border-[0.5px] px-4 py-1.5 text-left text-sm disabled:cursor-not-allowed disabled:opacity-60';

function optionClass(active: boolean): string {
  return `${optionBase} ${
    active
      ? 'border-primary bg-secondary text-foreground'
      : 'border-border bg-card text-foreground hover:bg-secondary'
  }`;
}

function Mark({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-5 shrink-0 items-center justify-center rounded-full border-[0.5px] ${
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border'
      }`}
    >
      {active ? <Check className="size-3" /> : null}
    </span>
  );
}

export function TeamBookingSelect({
  teams,
  value,
  labels,
  disabled = false,
  onChange,
}: TeamBookingSelectProps) {
  return (
    <section className="rounded-xl border-[0.5px] border-border bg-card p-4">
      <h2 className="text-base font-medium">{labels.title}</h2>

      <div
        role="radiogroup"
        aria-label={labels.title}
        className="mt-3 flex flex-col gap-2"
      >
        <button
          type="button"
          role="radio"
          aria-checked={value === null}
          disabled={disabled}
          onClick={() => onChange(null)}
          className={optionClass(value === null)}
        >
          <Mark active={value === null} />
          <span className="flex-1 font-medium">{labels.me}</span>
        </button>

        {teams.map((team) => {
          const active = value === team.id;

          return (
            <button
              key={team.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(team.id)}
              className={optionClass(active)}
            >
              <Mark active={active} />
              <TeamAvatar name={team.name} logoUrl={team.logoUrl} size="sm" />
              <span className="min-w-0 flex-1 truncate font-medium">
                {team.name}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {fillTemplate(labels.members, {
                  current: String(team.memberCount),
                  max: String(team.maxMembers),
                })}
              </span>
            </button>
          );
        })}
      </div>

      {value !== null ? (
        <p className="mt-3 text-sm text-muted-foreground">{labels.note}</p>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">{labels.hint}</p>
    </section>
  );
}
