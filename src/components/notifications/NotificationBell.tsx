'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { fillTemplate } from '@/lib/bookings/booking';
import {
  NOTIFICATIONS_PANEL_SIZE,
  formatBadgeCount,
  type NotificationItem,
} from '@/lib/notifications/notification';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/notifications/notification-api';
import { NotificationRow, type NotificationRowLabels } from './NotificationRow';

export interface NotificationBellLabels {
  bell: string;
  bellUnread: string;
  panelTitle: string;
  markAllRead: string;
  viewAll: string;
  emptyTitle: string;
  emptyDescription: string;
  loading: string;
  error: string;
  retry: string;
  row: NotificationRowLabels;
}

export interface NotificationBellProps {
  lng: 'el' | 'en';
  initialUnread: number;
  listHref: string;
  labels: NotificationBellLabels;
}

type Status = 'idle' | 'loading' | 'ready' | 'error';

const POLL_MS = 60_000;

const buttonClass =
  'relative size-9 items-center justify-center rounded-full text-foreground hover:bg-secondary';

export function NotificationBell({
  lng,
  initialUnread,
  listHref,
  labels,
}: NotificationBellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [unread, setUnread] = useState(initialUnread);
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [loadedAt, setLoadedAt] = useState(() => new Date());

  const open = openPath === pathname;

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [page, count] = await Promise.all([
        fetchNotifications({ lng, limit: NOTIFICATIONS_PANEL_SIZE }),
        fetchUnreadCount(),
      ]);
      setItems(page.items);
      setUnread(count);
      setLoadedAt(new Date());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [lng]);

  useEffect(() => {
    async function refresh() {
      if (document.visibilityState !== 'visible') return;
      try {
        setUnread(await fetchUnreadCount());
      } catch {
        return;
      }
    }

    const timer = window.setInterval(refresh, POLL_MS);
    document.addEventListener('visibilitychange', refresh);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenPath(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setOpenPath(null);
      buttonRef.current?.focus();
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function handleToggle() {
    if (open) {
      setOpenPath(null);
      return;
    }
    setOpenPath(pathname);
    void load();
  }

  function handleSelect(item: NotificationItem) {
    setOpenPath(null);
    if (item.isRead) return;

    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, isRead: true } : entry,
      ),
    );
    setUnread((count) => Math.max(0, count - 1));

    void markNotificationRead(item.id)
      .then(() => router.refresh())
      .catch(() => undefined);
  }

  async function handleMarkAll() {
    setItems((current) => current.map((entry) => ({ ...entry, isRead: true })));
    setUnread(0);

    try {
      await markAllNotificationsRead();
      router.refresh();
    } catch {
      void load();
    }
  }

  const label =
    unread > 0
      ? fillTemplate(labels.bellUnread, { count: String(unread) })
      : labels.bell;

  const badge =
    unread > 0 ? (
      <span
        aria-hidden="true"
        className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta px-1 text-[11px] font-medium leading-none text-primary-foreground"
      >
        {formatBadgeCount(unread)}
      </span>
    ) : null;

  return (
    <div ref={rootRef} className="relative">
      <Link
        href={listHref}
        aria-label={label}
        className={`${buttonClass} inline-flex md:hidden`}
      >
        <Bell className="size-5" aria-hidden="true" />
        {badge}
      </Link>

      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`${buttonClass} hidden md:inline-flex ${
          open ? 'bg-secondary' : ''
        }`}
      >
        <Bell className="size-5" aria-hidden="true" />
        {badge}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={labels.panelTitle}
          className="absolute right-0 top-full z-50 mt-2 hidden w-96 overflow-hidden rounded-2xl border-[0.5px] border-border bg-popover text-popover-foreground shadow-lg md:block"
        >
          <div className="flex items-center justify-between gap-3 border-b-[0.5px] border-border px-4 py-3">
            <h2 className="text-base">{labels.panelTitle}</h2>
            {unread > 0 ? (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-sm font-medium text-primary hover:underline"
              >
                {labels.markAllRead}
              </button>
            ) : null}
          </div>

          {items.length > 0 ? (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  lng={lng}
                  now={loadedAt}
                  labels={labels.row}
                  onSelect={handleSelect}
                />
              ))}
            </ul>
          ) : status === 'error' ? (
            <div className="px-4 py-8 text-center text-sm">
              <p className="text-muted-foreground">{labels.error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-3 h-10 rounded-full border-[0.5px] border-border px-4 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {labels.retry}
              </button>
            </div>
          ) : status === 'ready' ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium text-foreground">
                {labels.emptyTitle}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {labels.emptyDescription}
              </p>
            </div>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {labels.loading}
            </p>
          )}

          <Link
            href={listHref}
            onClick={() => setOpenPath(null)}
            className="block border-t-[0.5px] border-border px-4 py-3 text-center text-sm font-medium text-primary hover:bg-secondary"
          >
            {labels.viewAll}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
