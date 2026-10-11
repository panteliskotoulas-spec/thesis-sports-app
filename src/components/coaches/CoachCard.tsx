import Link from 'next/link';
import { ArrowRight, CalendarOff, Clock, MapPin, Star } from 'lucide-react';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import {
  formatNextSlot,
  formatPricePerHour,
  formatRating,
} from '@/lib/fields/format';
import type { CoachListItem } from '@/lib/coaches/coach-public';
import { getMockCoachRating } from '@/lib/reviews/mock-reviews';

export async function CoachCard({ coach }: { coach: CoachListItem }) {
  const { t } = await getT('coaches');
  const { t: tf } = await getT('fields');
  const { t: tr } = await getT('reviews');
  const lng = await routeLanguage();

  const rating = getMockCoachRating(coach.id);

  const available =
    coach.nextSlotAt !== null && coach.pricePerHourFrom !== null;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border-[0.5px] border-border bg-card">
      <Link
        href={`/${lng}/coaches/${coach.id}`}
        className="flex flex-1 flex-col gap-3 p-4 focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-base font-medium text-accent-foreground"
          >
            {coach.initials}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base">{coach.name}</h3>
            <span className="mt-1 inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
              {tf(`sports.${coach.sportType}`)}
            </span>
          </div>
          {rating ? (
            <span className="inline-flex shrink-0 items-center gap-1 self-start text-sm">
              <Star
                className="size-3.5 fill-terracotta text-terracotta"
                aria-hidden="true"
              />
              <strong>{formatRating(rating.average, lng)}</strong>
              <span className="text-muted-foreground">({rating.count})</span>
            </span>
          ) : (
            <span className="shrink-0 self-start rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {tr('new')}
            </span>
          )}
        </div>

        {coach.area ? (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            {coach.area}
          </p>
        ) : null}

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {coach.bio}
        </p>

        <div className="mt-auto flex flex-col gap-3 border-t-[0.5px] border-border pt-3">
          {available ? (
            <p className="flex items-center gap-1.5 text-sm text-accent-foreground">
              <Clock className="size-3.5 shrink-0" aria-hidden="true" />
              {t('card.next', {
                when: formatNextSlot(coach.nextSlotAt!, lng, {
                  today: t('card.today'),
                  tomorrow: t('card.tomorrow'),
                }),
              })}
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarOff className="size-3.5 shrink-0" aria-hidden="true" />
              {t('card.unavailable')}
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {available ? t('card.from') : t('card.approx')}{' '}
              <strong className="text-base text-foreground">
                {formatPricePerHour(
                  available ? coach.pricePerHourFrom! : coach.hourlyRate,
                  lng,
                )}
              </strong>{' '}
              {t('card.perHour')}
            </p>
            <span className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground">
              {t('card.profile')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
