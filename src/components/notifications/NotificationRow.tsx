'use client';

import Link from 'next/link';
import {
  Bell,
  CalendarX,
  CheckCircle2,
  CircleAlert,
  Star,
  User,
  Wallet,
} from 'lucide-react';
import {
  formatRelativeTime,
  getNotificationAppearance,
  toNotificationHref,
  type NotificationIconKey,
  type NotificationItem,
} from '@/lib/notifications/notification';

const icons: Record<NotificationIconKey, typeof Bell> = {
  check: CheckCircle2,
  calendarX: CalendarX,
  alert: CircleAlert,
  wallet: Wallet,
  star: Star,
  user: User,
  bell: Bell,
};

export interface NotificationRowLabels {
  justNow: string;
  unread: string;
}

export interface NotificationRowProps {
  item: NotificationItem;
  lng: 'el' | 'en';
  now: Date;
  labels: NotificationRowLabels;
  onSelect: (item: NotificationItem) => void;
}

export function NotificationRow({
  item,
  lng,
  now,
  labels,
  onSelect,
}: NotificationRowProps) {
  const appearance = getNotificationAppearance(item.type);
  const Icon = icons[appearance.icon];
  const href = toNotificationHref(item.linkUrl, lng);

  const iconClass =
    appearance.tone === 'negative'
      ? 'bg-destructive/15 text-destructive'
      : item.isRead
        ? 'bg-secondary text-muted-foreground'
        : 'bg-accent text-accent-foreground';

  const className = `flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-secondary ${
    item.isRead ? '' : 'bg-accent/50'
  }`;

  const content = (
    <>
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${iconClass}`}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm leading-snug ${
            item.isRead ? 'text-muted-foreground' : 'text-foreground'
          }`}
        >
          {item.message}
        </span>
        <span
          suppressHydrationWarning
          className="mt-1 block text-xs text-muted-foreground"
        >
          {formatRelativeTime(item.createdAt, now, lng, labels.justNow)}
        </span>
      </span>
      {item.isRead ? null : (
        <>
          <span
            aria-hidden="true"
            className="mt-1.5 size-2 shrink-0 rounded-full bg-terracotta"
          />
          <span className="sr-only">{labels.unread}</span>
        </>
      )}
    </>
  );

  return (
    <li className="border-b-[0.5px] border-border last:border-b-0">
      {href ? (
        <Link href={href} onClick={() => onSelect(item)} className={className}>
          {content}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => onSelect(item)}
          className={className}
        >
          {content}
        </button>
      )}
    </li>
  );
}
