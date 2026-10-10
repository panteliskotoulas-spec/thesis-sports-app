import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { BottomNavItem, BottomNavLinks } from './BottomNavLinks';

export interface BottomNavProps {
  user: { name: string; isAdmin?: boolean } | null;
}

// Εμφανίζεται μόνο σε συνδεδεμένους χρήστες (και μόνο σε κινητό, βλ. BottomNavLinks).
export async function BottomNav({ user }: BottomNavProps) {
  if (!user) return null;

  const { t } = await getT('common');
  const lng = await routeLanguage();

  const items: BottomNavItem[] = [
    { icon: 'home', href: `/${lng}`, label: t('nav.home'), exact: true },
    { icon: 'fields', href: `/${lng}/fields`, label: t('nav.fields') },
    { icon: 'bookings', href: `/${lng}/bookings`, label: t('nav.bookings') },
    { icon: 'profile', href: `/${lng}/profile`, label: t('nav.profile') },
  ];

  if (user.isAdmin) {
    items.push({
      icon: 'admin',
      href: `/${lng}/admin/fields`,
      label: t('nav.admin'),
    });
  }

  return <BottomNavLinks label={t('nav.mobileLabel')} items={items} />;
}
