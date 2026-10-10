import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { formatDayShort, formatTimeRange } from '@/lib/fields/detail-format';
import type { FieldDetail } from '@/lib/fields/detail';
import { todayInAthens } from '@/lib/fields/filters';
import { formatPricePerHour } from '@/lib/fields/format';
import { FieldDayStrip } from './FieldDayStrip';
import { FieldSlots } from './FieldSlots';

export async function FieldAvailability({ field }: { field: FieldDetail }) {
  const { t } = await getT('fields');
  const lng = await routeLanguage();
  const hrefBase = `/${lng}/fields/${field.id}`;

  const slotItems = field.slots.map((slot) => ({
    id: slot.id,
    time: formatTimeRange(slot.startTime, slot.endTime, lng),
    sport: t(`sports.${slot.sportType}`),
    price: formatPricePerHour(slot.price, lng),
  }));

  return (
    <section
      aria-labelledby="availability-title"
      className="rounded-xl border-[0.5px] border-border bg-card p-4 sm:p-5"
    >
      <h2 id="availability-title" className="text-lg">
        {t('detail.availability.title')}
      </h2>
      {field.pricePerHourFrom !== null ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {t('card.from')}{' '}
          <strong className="text-base text-foreground">
            {formatPricePerHour(field.pricePerHourFrom, lng)}
          </strong>{' '}
          {t('card.perHour')}
        </p>
      ) : null}

      <div className="mt-4">
        <FieldDayStrip
          days={field.days}
          selectedDay={field.selectedDay}
          today={todayInAthens()}
          lng={lng}
          hrefBase={hrefBase}
          labels={{
            list: t('detail.availability.days'),
            unavailable: t('detail.availability.dayUnavailable'),
            pickDate: t('detail.availability.pickDate'),
          }}
        />
      </div>

      <div className="mt-4">
        {slotItems.length > 0 ? (
          <FieldSlots
            key={field.selectedDay ?? 'none'}
            slots={slotItems}
            heading={t('detail.availability.slots')}
            bookLabel={t('detail.availability.book')}
            bookNote={t('detail.availability.bookSoon')}
          />
        ) : (
          <div className="rounded-xl bg-secondary p-4 text-sm">
            <p className="text-secondary-foreground">
              {field.selectedDay === null
                ? t('detail.availability.none')
                : t('detail.availability.emptyDay')}
            </p>
            {field.nextAvailableDay ? (
              <Link
                href={`${hrefBase}?date=${field.nextAvailableDay}`}
                scroll={false}
                className="mt-2 inline-block font-medium text-primary underline underline-offset-4"
              >
                {t('detail.availability.nextDay', {
                  day: formatDayShort(field.nextAvailableDay, lng),
                })}
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
