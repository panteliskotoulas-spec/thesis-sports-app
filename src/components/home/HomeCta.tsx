import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';

export async function HomeCta({ loggedIn }: { loggedIn: boolean }) {
  const { t } = await getT('home');
  const lng = await routeLanguage();

  return (
    <section className="mx-auto w-full max-w-360 px-4 py-12 text-center sm:px-6 md:py-20 lg:px-8">
      <h2 className="text-2xl md:text-3xl">{t('cta.title')}</h2>
      <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
        {loggedIn ? t('cta.subtitleUser') : t('cta.subtitleGuest')}
      </p>
      <Link
        href={loggedIn ? `/${lng}/fields` : `/${lng}/register`}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        {loggedIn ? t('cta.fields') : t('cta.register')}
      </Link>
    </section>
  );
}
