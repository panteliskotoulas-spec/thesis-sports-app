import { CalendarOff, Clock, Home, MapPin, Star, Sun } from 'lucide-react';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { EntityCard } from '@/components/shared/EntityCard';
import {
  formatNextSlot,
  formatPricePerHour,
  formatRating,
} from '@/lib/fields/format';
import type { FieldListItem } from '@/lib/fields/types';

export async function FieldCard({ field }: { field: FieldListItem }) {
  const { t } = await getT('fields');
  const lng = await routeLanguage();

  // Χωρίς μελλοντικό ανοιχτό slot: αμυδρή φωτογραφία και ένδειξη αντί για τιμή.
  const available =
    field.nextSlotAt !== null && field.pricePerHourFrom !== null;

  return (
    <EntityCard
      // Η σελίδα λεπτομερειών ({id}) φτιάχνεται στο επόμενο slice: μέχρι τότε δίνει 404.
      href={`/${lng}/fields/${field.id}`}
      title={field.name}
      imageUrl={field.imageUrl}
      dimImage={!available}
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-xs font-medium text-foreground">
          {field.indoor ? (
            <Home className="size-3.5" aria-hidden="true" />
          ) : (
            <Sun className="size-3.5" aria-hidden="true" />
          )}
          {field.indoor ? t('card.indoor') : t('card.outdoor')}
        </span>
      }
      aside={
        field.rating ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-sm">
            <Star
              className="size-3.5 fill-terracotta text-terracotta"
              aria-hidden="true"
            />
            <strong>{formatRating(field.rating.average, lng)}</strong>
            <span className="text-muted-foreground">
              ({field.rating.count})
            </span>
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {t('card.new')}
          </span>
        )
      }
      meta={
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          {field.area}
        </p>
      }
      tags={
        field.sports.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {field.sports.map((sport) => (
              <li
                key={sport}
                className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
              >
                {t(`sports.${sport}`)}
              </li>
            ))}
          </ul>
        ) : null
      }
      footer={
        available ? (
          <div className="flex flex-col gap-1">
            <p className="flex items-center gap-1.5 text-sm text-accent-foreground">
              <Clock className="size-3.5 shrink-0" aria-hidden="true" />
              {t('card.next', {
                when: formatNextSlot(field.nextSlotAt!, lng, {
                  today: t('card.today'),
                  tomorrow: t('card.tomorrow'),
                }),
              })}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('card.from')}{' '}
              <strong className="text-base">
                {formatPricePerHour(field.pricePerHourFrom!, lng)}
              </strong>{' '}
              {t('card.perHour')}
            </p>
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarOff className="size-3.5 shrink-0" aria-hidden="true" />
            {t('card.unavailable')}
          </p>
        )
      }
    />
  );
}
