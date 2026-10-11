'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import {
  NOTIFICATIONS_PAGE_SIZE,
  type NotificationItem,
} from '@/lib/notifications/notification';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/notifications/notification-api';
import { NotificationRow, type NotificationRowLabels } from './NotificationRow';

export interface NotificationsListLabels {
  markAllRead: string;
  loadMore: string;
  loading: string;
  error: string;
  emptyTitle: string;
  emptyDescription: string;
  row: NotificationRowLabels;
}

export interface NotificationsListProps {
  initialItems: NotificationItem[];
  initialCursor: string | null;
  lng: 'el' | 'en';
  labels: NotificationsListLabels;
}

export function NotificationsList({
  initialItems,
  initialCursor,
  lng,
  labels,
}: NotificationsListProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [failed, setFailed] = useState(false);
  const [now] = useState(() => new Date());

  const hasUnread = items.some((item) => !item.isRead);

  async function handleLoadMore() {
    if (!cursor || loading) return;

    setLoading(true);
    setFailed(false);

    try {
      const page = await fetchNotifications({
        lng,
        limit: NOTIFICATIONS_PAGE_SIZE,
        cursor,
      });
      setItems((current) => [
        ...current,
        ...page.items.filter(
          (entry) => !current.some((existing) => existing.id === entry.id),
        ),
      ]);
      setCursor(page.nextCursor);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAll() {
    if (marking) return;

    setMarking(true);
    setFailed(false);

    try {
      await markAllNotificationsRead();
      setItems((current) =>
        current.map((entry) => ({ ...entry, isRead: true })),
      );
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setMarking(false);
    }
  }

  function handleSelect(item: NotificationItem) {
    if (item.isRead) return;

    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, isRead: true } : entry,
      ),
    );

    void markNotificationRead(item.id)
      .then(() => router.refresh())
      .catch(() => undefined);
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border-[0.5px] border-border bg-card p-6 text-center">
        <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Bell className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-3 text-lg">{labels.emptyTitle}</h2>
        <p className="mt-1 text-muted-foreground">{labels.emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {hasUnread ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={marking}
            className="inline-flex h-9 items-center rounded-full px-3 text-sm font-medium text-primary hover:bg-secondary disabled:opacity-60"
          >
            {labels.markAllRead}
          </button>
        </div>
      ) : null}

      <ul className="overflow-hidden rounded-xl border-[0.5px] border-border bg-card">
        {items.map((item) => (
          <NotificationRow
            key={item.id}
            item={item}
            lng={lng}
            now={now}
            labels={labels.row}
            onSelect={handleSelect}
          />
        ))}
      </ul>

      {failed ? (
        <p role="alert" className="text-sm text-terracotta">
          {labels.error}
        </p>
      ) : null}

      {cursor ? (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={loading}
          className="h-11 w-full rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-60"
        >
          {loading ? labels.loading : labels.loadMore}
        </button>
      ) : null}
    </div>
  );
}
