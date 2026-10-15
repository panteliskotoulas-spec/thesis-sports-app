import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { SignOutButton } from '@/components/shared/SignOutButton';
import { NavLink } from '@/components/shared/NavLink';
import { MessagesLink } from '@/components/chat/MessagesLink';
import {
  NotificationBell,
  type NotificationBellLabels,
} from '@/components/notifications/NotificationBell';
import { getServerCaller } from '@/trpc/server/caller';

export interface HeaderProps {
  user: { name: string; avatarUrl?: string; isAdmin?: boolean } | null;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

async function loadMessagesUnread(): Promise<number> {
  try {
    const caller = await getServerCaller();
    return await caller.conversations.unreadCount();
  } catch {
    return 0;
  }
}

async function loadUnreadCount(): Promise<number> {
  try {
    const caller = await getServerCaller();
    return await caller.notifications.unreadCount();
  } catch {
    return 0;
  }
}

export async function Header({ user }: HeaderProps) {
  const { t } = await getT('common');
  const { t: tn } = await getT('fields');
  const { t: tc } = await getT('chat');
  const lng = await routeLanguage();
  const language = lng === 'en' ? 'en' : 'el';
  const [unread, messagesUnread] = user
    ? await Promise.all([loadUnreadCount(), loadMessagesUnread()])
    : [0, 0];

  const bellLabels: NotificationBellLabels = {
    bell: tn('notifications.bell'),
    bellUnread: tn('notifications.bellUnread'),
    panelTitle: tn('notifications.panelTitle'),
    markAllRead: tn('notifications.markAllRead'),
    viewAll: tn('notifications.viewAll'),
    emptyTitle: tn('notifications.emptyTitle'),
    emptyDescription: tn('notifications.emptyDescription'),
    loading: tn('notifications.loading'),
    error: tn('notifications.error'),
    retry: tn('notifications.retry'),
    row: {
      justNow: tn('notifications.justNow'),
      unread: tn('notifications.unread'),
    },
  };

  const navItems = [
    { slug: 'fields', label: t('nav.fields') },
    { slug: 'teams', label: t('nav.teams') },
    { slug: 'coaches', label: t('nav.coaches') },
  ];

  if (user?.isAdmin) {
    navItems.push({ slug: 'admin/fields', label: t('nav.admin') });
  }

  return (
    <header className="border-b-[0.5px] border-border bg-background">
      <div className="border-b-[0.5px] border-border bg-secondary md:hidden">
        <div className="mx-auto flex h-9 max-w-360 items-center justify-end gap-1 px-4 sm:px-6">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-360 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 lg:gap-10">
          <Link className="whitespace-nowrap text-foreground" href={`/${lng}`}>
            {t('app.name')}
          </Link>

          <nav className="hidden md:block">
            <ul className="flex items-center gap-1 lg:gap-2">
              {navItems.map((item) => (
                <li key={item.slug}>
                  <NavLink href={`/${lng}/${item.slug}`}>{item.label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex items-center">
          <div className="hidden items-center gap-1 md:flex">
            <LanguageSwitcher />
            <ThemeToggle />
            <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />
          </div>

          {user ? (
            <div className="flex items-center gap-1">
              <MessagesLink
                key={`messages-${messagesUnread}`}
                href={`/${lng}/messages`}
                initialUnread={messagesUnread}
                labels={{
                  messages: tc('nav.messages'),
                  messagesUnread: tc('nav.messagesUnread'),
                }}
              />
              <NotificationBell
                key={unread}
                lng={language}
                initialUnread={unread}
                listHref={`/${lng}/notifications`}
                labels={bellLabels}
              />
              <Link
                href={`/${lng}/profile`}
                aria-label={t('nav.profile')}
                className="flex items-center gap-2 rounded-full p-1 hover:bg-secondary md:pr-3"
              >
                <span
                  aria-hidden="true"
                  className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm text-foreground"
                >
                  {getInitials(user.name)}
                </span>
                <span className="hidden max-w-40 truncate text-foreground md:inline">
                  {user.name}
                </span>
              </Link>

              <SignOutButton lng={lng} label={t('auth.logout')} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                className="whitespace-nowrap rounded-full border-[0.5px] border-border px-4 py-1.5 text-foreground hover:bg-secondary md:border-transparent"
                href={`/${lng}/login`}
              >
                {t('auth.login')}
              </Link>
              <Link
                className="whitespace-nowrap rounded-full bg-primary px-4 py-1.5 text-primary-foreground hover:opacity-90"
                href={`/${lng}/register`}
              >
                {t('auth.register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
