import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { FieldDayStrip } from '@/components/fields/FieldDayStrip';
import type { CoachDetail } from '@/lib/coaches/coach-public';
import { formatDayShort, formatTimeRange } from '@/lib/fields/detail-format';
import { todayInAthens } from '@/lib/fields/filters';
import { formatPricePerHour } from '@/lib/fields/format';

export async function CoachAvailability({ coach }: { coach: CoachDetail }) {
  const { t } = await getT('coaches');
  const lng = await routeLanguage();
  const hrefBase = `/${lng}/coaches/${coach.id}`;

  return (
    <section
      aria-labelledby="coach-availability-title"
      className="rounded-xl border-[0.5px] border-border bg-card p-4 sm:p-5"
    >
      <h2 id="coach-availability-title" className="text-lg">
        {t('detail.availability.title')}
      </h2>
      {coach.pricePerHourFrom !== null ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {t('card.from')}{' '}
          <strong className="text-base text-foreground">
            {formatPricePerHour(coach.pricePerHourFrom, lng)}
          </strong>{' '}
          {t('card.perHour')}
        </p>
      ) : null}

      {coach.isSelf ? (
        <div className="mt-4 rounded-xl bg-secondary p-4 text-sm">
          <p className="text-secondary-foreground">
            {t('detail.availability.ownProfile')}
          </p>
          <Link
            href={`/${lng}/coaches/slots`}
            className="mt-2 inline-block font-medium text-primary underline underline-offset-4"
          >
            {t('detail.availability.manageSlots')}
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4">
            <FieldDayStrip
              days={coach.days}
              selectedDay={coach.selectedDay}
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
            {coach.slots.length > 0 ? (
              <div>
                <h3 className="sr-only">{t('detail.availability.slots')}</h3>
                <ul className="flex flex-col gap-2">
                  {coach.slots.map((slot) => (
                    <li
                      key={slot.id}
                      className="flex items-center justify-between gap-3 rounded-xl border-[0.5px] border-border bg-card px-3 py-3"
                    >
                      <span className="flex flex-col">
                        <span className="font-medium">
                          {formatTimeRange(slot.startTime, slot.endTime, lng)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatPricePerHour(slot.price, lng)}
                        </span>
                      </span>
                      <button
                        type="button"
                        disabled
                        className="h-11 shrink-0 cursor-not-allowed rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground opacity-50"
                      >
                        {t('detail.availability.request')}
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  {t('detail.availability.requestSoon')}
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-secondary p-4 text-sm">
                <p className="text-secondary-foreground">
                  {coach.selectedDay === null
                    ? t('detail.availability.none')
                    : t('detail.availability.emptyDay')}
                </p>
                {coach.nextAvailableDay ? (
                  <Link
                    href={`${hrefBase}?date=${coach.nextAvailableDay}`}
                    scroll={false}
                    className="mt-2 inline-block font-medium text-primary underline underline-offset-4"
                  >
                    {t('detail.availability.nextDay', {
                      day: formatDayShort(coach.nextAvailableDay, lng),
                    })}
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
