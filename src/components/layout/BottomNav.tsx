import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { buildAccountMenu } from '@/lib/layout/account-menu';
import { loadCoachMenuStatus } from '@/lib/layout/account-menu-loader';
import { getServerCaller } from '@/trpc/server/caller';
import { BottomNavItem, BottomNavLinks } from './BottomNavLinks';

export interface BottomNavProps {
  user: { name: string; isAdmin?: boolean; accountType?: string | null } | null;
}

async function loadMessagesUnread(): Promise<number> {
  try {
    const caller = await getServerCaller();
    return await caller.conversations.unreadCount();
  } catch {
    return 0;
  }
}

// Εμφανίζεται μόνο σε συνδεδεμένους χρήστες (και μόνο σε κινητό, βλ. BottomNavLinks).
export async function BottomNav({ user }: BottomNavProps) {
  if (!user) return null;

  const { t } = await getT('common');
  const { t: tc } = await getT('chat');
  const lng = await routeLanguage();
  const [messagesUnread, coachStatus] = await Promise.all([
    loadMessagesUnread(),
    loadCoachMenuStatus(),
  ]);

  const items: BottomNavItem[] = [
    { icon: 'home', href: `/${lng}`, label: t('nav.home'), exact: true },
    { icon: 'fields', href: `/${lng}/fields`, label: t('nav.fields') },
    { icon: 'teams', href: `/${lng}/teams`, label: t('nav.teams') },
    { icon: 'coaches', href: `/${lng}/coaches`, label: t('nav.coaches') },
  ];

  const groups = buildAccountMenu({
    lng,
    t,
    tc,
    isAdmin: Boolean(user.isAdmin),
    isBusiness: user.accountType === 'BUSINESS',
    coachStatus,
  });

  return (
    <BottomNavLinks
      label={t('nav.mobileLabel')}
      items={items}
      messagesUnread={messagesUnread}
      menu={{
        label: t('nav.menu'),
        title: t('nav.menuTitle'),
        closeLabel: t('nav.closeMenu'),
        unreadLabel: tc('nav.messagesUnread'),
        signOutLabel: t('auth.logout'),
        lng,
        groups,
      }}
    />
  );
}
