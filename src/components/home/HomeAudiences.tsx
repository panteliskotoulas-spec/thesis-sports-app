import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { ArrowRight, Award, MapPin, Users } from 'lucide-react';
import { getT } from '@/i18n.server';

export async function HomeAudiences() {
  const { t } = await getT('home');
  const lng = await routeLanguage();

  const audiences = [
    {
      icon: Users,
      href: `/${lng}/teams/new`,
      title: t('audiences.players.title'),
      description: t('audiences.players.description'),
      cta: t('audiences.players.cta'),
    },
    {
      icon: Award,
      href: `/${lng}/coaches/apply`,
      title: t('audiences.coaches.title'),
      description: t('audiences.coaches.description'),
      cta: t('audiences.coaches.cta'),
    },
    {
      icon: MapPin,
      href: `/${lng}/owner/fields/new`,
      title: t('audiences.owners.title'),
      description: t('audiences.owners.description'),
      cta: t('audiences.owners.cta'),
    },
  ];

  return (
    <section className="border-y-[0.5px] border-border bg-secondary">
      <div className="mx-auto w-full max-w-360 px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        <h2>{t('audiences.title')}</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {audiences.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex h-full flex-col gap-2 rounded-xl border-[0.5px] border-border bg-card p-5 hover:bg-accent"
              >
                <item.icon className="size-5 text-primary" aria-hidden="true" />
                <h3 className="mt-1">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-medium text-accent-foreground">
                  {item.cta}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
