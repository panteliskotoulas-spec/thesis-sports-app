import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { todayInAthens } from '@/lib/fields/filters';

export async function Footer({ loggedIn }: { loggedIn: boolean }) {
  const { t } = await getT('common');
  const lng = await routeLanguage();
  const year = todayInAthens().slice(0, 4);

  const explore = [
    { href: `/${lng}/fields`, label: t('nav.fields') },
    { href: `/${lng}/teams`, label: t('nav.teams') },
    { href: `/${lng}/coaches`, label: t('nav.coaches') },
  ];

  const account = loggedIn
    ? [
        { href: `/${lng}/profile`, label: t('nav.profile') },
        { href: `/${lng}/bookings`, label: t('nav.bookings') },
      ]
    : [
        { href: `/${lng}/login`, label: t('auth.login') },
        { href: `/${lng}/register`, label: t('auth.register') },
      ];

  const groups = [
    { title: t('footer.explore'), links: explore },
    { title: t('footer.account'), links: account },
  ];

  return (
    <footer className="border-t-[0.5px] border-border bg-background">
      <div className="mx-auto w-full max-w-360 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
          <div>
            <p className="text-base font-medium text-foreground">
              {t('app.name')}
            </p>
            <p className="mt-2 max-w-xs text-muted-foreground">
              {t('footer.tagline')}
            </p>
          </div>
          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="text-sm font-medium text-foreground">
                {group.title}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="mt-8 border-t-[0.5px] border-border pt-5 text-sm text-muted-foreground">
          © {year} {t('app.name')}. {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
}
