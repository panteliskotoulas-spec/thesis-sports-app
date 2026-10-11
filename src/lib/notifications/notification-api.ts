import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/trpc/server/routers/_app';
import type { NotificationPage } from '@/lib/notifications/notification';

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
      fetch(url, options) {
        return fetch(url, { ...options, credentials: 'include' });
      },
    }),
  ],
});

export interface FetchNotificationsInput {
  lng: 'el' | 'en';
  limit: number;
  cursor?: string;
}

export async function fetchNotifications(
  input: FetchNotificationsInput,
): Promise<NotificationPage> {
  return client.notifications.list.query(input);
}

export async function fetchUnreadCount(): Promise<number> {
  return client.notifications.unreadCount.query();
}

export async function markNotificationRead(id: string): Promise<void> {
  await client.notifications.markRead.mutate({ id });
}

export async function markAllNotificationsRead(): Promise<void> {
  await client.notifications.markAllRead.mutate();
}
