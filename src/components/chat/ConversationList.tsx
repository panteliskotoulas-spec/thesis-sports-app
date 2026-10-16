'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TeamAvatar } from '@/components/teams/TeamAvatar';
import { fillTemplate } from '@/lib/bookings/booking';
import { fetchConversations } from '@/lib/chat/chat-api';
import { CHAT_INBOX_POLL_MS, type ChatConversation } from '@/lib/chat/chat';
import {
  formatBadgeCount,
  formatRelativeTime,
} from '@/lib/notifications/notification';

export interface ChatInboxLabels {
  loading: string;
  error: string;
  retry: string;
  emptyTitle: string;
  emptyDescription: string;
  kindTeam: string;
  kindCoach: string;
  you: string;
  noMessages: string;
  unreadOne: string;
  unreadOther: string;
  justNow: string;
}

export interface ConversationListProps {
  lng: 'el' | 'en';
  labels: ChatInboxLabels;
  embedded?: boolean;
  onSelect?: (conversationId: string) => void;
}

function previewOf(item: ChatConversation, labels: ChatInboxLabels): string {
  const last = item.lastMessage;
  if (!last) return labels.noMessages;
  if (last.isMine) return `${labels.you}: ${last.content}`;
  if (item.kind === 'TEAM') return `${last.senderName}: ${last.content}`;
  return last.content;
}

export function ConversationList({
  lng,
  labels,
  embedded = false,
  onSelect,
}: ConversationListProps) {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [items, setItems] = useState<ChatConversation[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const result = await fetchConversations(lng);
      if (cancelled) return;
      if (result.status === 'ok') {
        setItems(result.items);
        setNow(new Date());
        setPhase('ready');
      } else {
        setPhase('error');
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [attempt, lng]);

  useEffect(() => {
    if (phase !== 'ready') return;

    let cancelled = false;

    const timer = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      const result = await fetchConversations(lng);
      if (cancelled) return;
      if (result.status === 'ok') {
        setItems(result.items);
        setNow(new Date());
      }
    }, CHAT_INBOX_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [phase, lng]);

  function handleRetry() {
    setPhase('loading');
    setAttempt((value) => value + 1);
  }

  const boxClass = embedded
    ? ''
    : 'rounded-xl border-[0.5px] border-border bg-card';
  const rowClass =
    'flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary';

  if (phase === 'loading') {
    return (
      <p
        role="status"
        className={`text-muted-foreground ${embedded ? 'p-4' : ''}`}
      >
        {labels.loading}
      </p>
    );
  }

  if (phase === 'error') {
    return (
      <div className={`p-6 ${boxClass}`}>
        <p role="alert" className="text-destructive">
          {labels.error}
        </p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-4 h-11 rounded-full border-[0.5px] border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-secondary"
        >
          {labels.retry}
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`p-6 text-center ${boxClass}`}>
        <h2 className="text-lg">{labels.emptyTitle}</h2>
        <p className="mt-2 text-muted-foreground">{labels.emptyDescription}</p>
      </div>
    );
  }

  return (
    <ul className={embedded ? '' : `overflow-hidden ${boxClass}`}>
      {items.map((item) => {
        const unread = item.unreadCount > 0;

        const content = (
          <>
            <TeamAvatar name={item.title} logoUrl={item.logoUrl} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span
                  className={`truncate text-sm ${
                    unread ? 'font-medium' : ''
                  } text-foreground`}
                >
                  {item.title}
                </span>
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  {item.kind === 'TEAM' ? labels.kindTeam : labels.kindCoach}
                </span>
              </span>
              <span
                className={`mt-0.5 block truncate text-sm ${
                  unread ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {previewOf(item, labels)}
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1.5">
              {item.lastMessage ? (
                <span
                  suppressHydrationWarning
                  className="text-xs text-muted-foreground"
                >
                  {formatRelativeTime(
                    item.lastMessage.createdAt,
                    now,
                    lng,
                    labels.justNow,
                  )}
                </span>
              ) : null}
              {unread ? (
                <>
                  <span
                    aria-hidden="true"
                    className="flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1.5 text-xs text-white"
                  >
                    {formatBadgeCount(item.unreadCount)}
                  </span>
                  <span className="sr-only">
                    {fillTemplate(
                      item.unreadCount === 1
                        ? labels.unreadOne
                        : labels.unreadOther,
                      { count: String(item.unreadCount) },
                    )}
                  </span>
                </>
              ) : null}
            </span>
          </>
        );

        return (
          <li
            key={item.id}
            className="border-b-[0.5px] border-border last:border-b-0"
          >
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={rowClass}
              >
                {content}
              </button>
            ) : (
              <Link href={`/${lng}/messages/${item.id}`} className={rowClass}>
                {content}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
