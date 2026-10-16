'use client';

import { useEffect, useState } from 'react';
import { fetchChatUnreadCount } from '@/lib/chat/chat-api';
import { CHAT_UNREAD_EVENT, CHAT_UNREAD_POLL_MS } from '@/lib/chat/chat';

export function useChatUnread(initial: number): number {
  const [unread, setUnread] = useState(initial);

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

  return unread;
}
