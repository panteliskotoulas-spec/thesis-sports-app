import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { FieldDayStrip } from '@/components/fields/FieldDayStrip';
import { formatAmount } from '@/lib/bookings/booking';
import type { CoachDetail } from '@/lib/coaches/coach-public';
import type { CoachRequestSlotItem } from '@/lib/coaches/coach-session';
import { buildCoachSlotRequestLabels } from '@/lib/coaches/coach-session-labels';
import { formatDayShort, formatTimeRange } from '@/lib/fields/detail-format';
import { todayInAthens } from '@/lib/fields/filters';
import { formatPricePerHour } from '@/lib/fields/format';
import type { TeamBookingOption } from '@/lib/teams/team-booking';
import { CoachSlotRequest } from './CoachSlotRequest';

export async function CoachAvailability({
  coach,
  teams,
  loginHref,
}: {
  coach: CoachDetail;
  teams: TeamBookingOption[];
  loginHref: string | null;
}) {
  const { t } = await getT('coaches');
  const { t: tt } = await getT('teams');
  const lng = await routeLanguage();
  const hrefBase = `/${lng}/coaches/${coach.id}`;
  const requestLabels = buildCoachSlotRequestLabels(t, tt);

  const slotItems: CoachRequestSlotItem[] = coach.slots.map((slot) => ({
    id: slot.id,
    time: formatTimeRange(slot.startTime, slot.endTime, lng),
    price: formatAmount(slot.price, lng),
  }));

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
              <CoachSlotRequest
                lng={lng}
                slots={slotItems}
                teams={teams}
                loginHref={loginHref}
                labels={requestLabels}
              />
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
