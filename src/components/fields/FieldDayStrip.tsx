import Link from 'next/link';
import { formatDayChip } from '@/lib/fields/detail-format';
import type { FieldAvailabilityDay } from '@/lib/fields/detail';
import { chipOff, chipOn } from './chipStyles';
import { FieldDatePicker } from './FieldDatePicker';
import { FieldDayList } from './FieldDayList';

export interface FieldDayStripProps {
  days: FieldAvailabilityDay[];
  selectedDay: string | null;
  today: string;
  lng: string;
  hrefBase: string;
  labels: {
    list: string;
    unavailable: string;
    pickDate: string;
  };
}

const chipBase =
  'flex w-14 shrink-0 flex-col items-center rounded-xl border-[0.5px] py-2 text-sm';

export function FieldDayStrip({
  days,
  selectedDay,
  today,
  lng,
  hrefBase,
  labels,
}: FieldDayStripProps) {
  const outsideWindow =
    selectedDay && !days.some((entry) => entry.day === selectedDay)
      ? { day: selectedDay, available: true }
      : null;
  const entries = outsideWindow ? [outsideWindow, ...days] : days;

  return (
    <nav aria-label={labels.list}>
      <FieldDayList selectedDay={selectedDay}>
        <li className="sticky left-0 z-10 shrink-0 bg-card pr-1">
          <FieldDatePicker
            min={today}
            value={selectedDay}
            label={labels.pickDate}
          />
        </li>
        {entries.map(({ day, available }) => {
          const parts = formatDayChip(day, lng);
          const isSelected = day === selectedDay;
          const content = (
            <>
              <span className="text-xs">{parts.weekday}</span>
              <span
                className={`text-base font-medium ${
                  available ? '' : 'line-through'
                }`}
              >
                {parts.dayNumber}
              </span>
            </>
          );

          return (
            <li key={day} className="shrink-0">
              {available || isSelected ? (
                <Link
                  href={`${hrefBase}?date=${day}`}
                  scroll={false}
                  aria-label={parts.full}
                  aria-current={isSelected ? 'date' : undefined}
                  className={`${chipBase} ${isSelected ? chipOn : chipOff}`}
                >
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  aria-label={`${parts.full}, ${labels.unavailable}`}
                  className={`${chipBase} cursor-not-allowed border-border bg-card text-muted-foreground`}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </FieldDayList>
    </nav>
  );
}
