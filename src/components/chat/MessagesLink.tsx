'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { fillTemplate } from '@/lib/bookings/booking';
import { fetchChatUnreadCount } from '@/lib/chat/chat-api';
import { CHAT_UNREAD_EVENT, CHAT_UNREAD_POLL_MS } from '@/lib/chat/chat';
import { formatBadgeCount } from '@/lib/notifications/notification';

export interface MessagesLinkLabels {
  messages: string;
  messagesUnread: string;
}

export interface MessagesLinkProps {
  href: string;
  initialUnread: number;
  labels: MessagesLinkLabels;
}

export function MessagesLink({
  href,
  initialUnread,
  labels,
}: MessagesLinkProps) {
  const [unread, setUnread] = useState(initialUnread);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      if (document.visibilityState !== 'visible') return;
      const count = await fetchChatUnreadCount();
      if (cancelled || count === null) return;
      setUnread(count);
    }

    const timer = window.setInterval(refresh, CHAT_UNREAD_POLL_MS);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener(CHAT_UNREAD_EVENT, refresh);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener(CHAT_UNREAD_EVENT, refresh);
    };
  }, []);

  const label =
    unread > 0
      ? fillTemplate(labels.messagesUnread, { count: String(unread) })
      : labels.messages;

  return (
    <Link
      href={href}
      aria-label={label}
      className="relative inline-flex size-9 items-center justify-center rounded-full text-foreground hover:bg-secondary"
    >
      <MessageCircle className="size-5" aria-hidden="true" />
      {unread > 0 ? (
        <span
          aria-hidden="true"
          className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta px-1 text-[11px] font-medium leading-none text-primary-foreground"
        >
          {formatBadgeCount(unread)}
        </span>
      ) : null}
    </Link>
  );
}
