import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import { getT } from '@/i18n.server';

const PREVIEW_SLOTS = ['18:00', '19:00', '20:00', '21:00'] as const;
const PREVIEW_SELECTED = '19:00';

const primaryButton =
  'inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90';
const secondaryButton =
  'inline-flex h-11 items-center justify-center rounded-full border-[0.5px] border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-secondary';

export async function HomeHero({ loggedIn }: { loggedIn: boolean }) {
  const { t } = await getT('home');
  const lng = await routeLanguage();

  return (
    <section className="mx-auto grid w-full max-w-360 items-center gap-10 px-4 py-10 sm:px-6 md:py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <MapPin className="size-3.5" aria-hidden="true" />
          {t('hero.badge')}
        </span>
        <h1 className="mt-4 text-4xl leading-tight md:text-5xl">
          {t('hero.title')}
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          {t('hero.subtitle')}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href={`/${lng}/fields`} className={primaryButton}>
            {t('hero.ctaFields')}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          {loggedIn ? (
            <Link href={`/${lng}/bookings`} className={secondaryButton}>
              {t('hero.ctaBookings')}
            </Link>
          ) : (
            <Link href={`/${lng}/register`} className={secondaryButton}>
              {t('hero.ctaRegister')}
            </Link>
          )}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="w-full max-w-sm justify-self-center rounded-xl border-[0.5px] border-border bg-card p-3 lg:justify-self-end"
      >
        <div className="flex h-36 items-center justify-center rounded-lg bg-accent text-accent-foreground/50">
          <MapPin className="size-10" />
        </div>
        <div className="mt-3 px-1">
          <p className="text-base font-medium text-foreground">
            {t('hero.preview.title')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('hero.preview.sport')}
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-sm text-accent-foreground">
            <Clock className="size-3.5" />
            {t('hero.preview.slots')}
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {PREVIEW_SLOTS.map((slot) => (
              <li
                key={slot}
                className={`rounded-full border-[0.5px] px-3 py-1 text-xs font-medium ${
                  slot === PREVIEW_SELECTED
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground'
                }`}
              >
                {slot}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex h-11 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {t('hero.preview.cta')}
          </div>
        </div>
      </div>
    </section>
  );
}
