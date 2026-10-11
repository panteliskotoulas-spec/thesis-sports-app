import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import {
  NotificationsList,
  type NotificationsListLabels,
} from '@/components/notifications/NotificationsList';
import { NOTIFICATIONS_PAGE_SIZE } from '@/lib/notifications/notification';
import { getCurrentUser } from '@/lib/session';
import { getServerCaller } from '@/trpc/server/caller';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('fields');
  return { title: t('notifications.meta') };
}

export default async function NotificationsPage() {
  const { t } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  const language = lng === 'en' ? 'en' : 'el';
  const caller = await getServerCaller();
  const page = await caller.notifications.list({
    lng: language,
    limit: NOTIFICATIONS_PAGE_SIZE,
  });

  const labels: NotificationsListLabels = {
    markAllRead: t('notifications.markAllRead'),
    loadMore: t('notifications.loadMore'),
    loading: t('notifications.loading'),
    error: t('notifications.error'),
    emptyTitle: t('notifications.emptyTitle'),
    emptyDescription: t('notifications.emptyDescription'),
    row: {
      justNow: t('notifications.justNow'),
      unread: t('notifications.unread'),
    },
  };

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <h1>{t('notifications.title')}</h1>
        <p className="mt-2 text-muted-foreground">
          {t('notifications.subtitle')}
        </p>

        <div className="mt-6">
          <NotificationsList
            initialItems={page.items}
            initialCursor={page.nextCursor}
            lng={language}
            labels={labels}
          />
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
