'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink, MessageCircle, X } from 'lucide-react';
import { fillTemplate } from '@/lib/bookings/booking';
import { CHAT_POPUP_EVENT } from '@/lib/chat/chat';
import { formatBadgeCount } from '@/lib/notifications/notification';
import { ChatThread, type ChatThreadLabels } from './ChatThread';
import { ConversationList, type ChatInboxLabels } from './ConversationList';
import { useChatUnread } from './useChatUnread';

export interface ChatDockLabels {
  messages: string;
  messagesUnread: string;
  close: string;
  openFull: string;
  inbox: ChatInboxLabels;
  thread: ChatThreadLabels;
}

export interface ChatDockProps {
  lng: 'el' | 'en';
  initialUnread: number;
  labels: ChatDockLabels;
}

export function ChatDock({ lng, initialUnread, labels }: ChatDockProps) {
  const pathname = usePathname();
  const unread = useChatUnread(initialUnread);
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const hidden = pathname.startsWith(`/${lng}/messages`);

  useEffect(() => {
    function handleOpen(event: Event) {
      const detail = (event as CustomEvent<{ conversationId?: string }>).detail;
      setConversationId(detail?.conversationId ?? null);
      setOpen(true);
    }

    window.addEventListener(CHAT_POPUP_EVENT, handleOpen);
    return () => window.removeEventListener(CHAT_POPUP_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  if (hidden) return null;

  const buttonLabel = open
    ? labels.close
    : unread > 0
      ? fillTemplate(labels.messagesUnread, { count: String(unread) })
      : labels.messages;

  return (
    <div className="hidden md:block">
      {open ? (
        <div
          role="dialog"
          aria-label={labels.messages}
          className="fixed bottom-24 right-6 z-50 flex h-[min(560px,calc(100dvh-8rem))] w-95 flex-col overflow-hidden rounded-xl border-[0.5px] border-border bg-card shadow-lg"
        >
          {conversationId ? (
            <ChatThread
              key={conversationId}
              lng={lng}
              conversationId={conversationId}
              backHref={`/${lng}/messages`}
              labels={labels.thread}
              onBack={() => setConversationId(null)}
              headerActions={
                <Link
                  href={`/${lng}/messages/${conversationId}`}
                  aria-label={labels.openFull}
                  title={labels.openFull}
                  className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                </Link>
              }
            />
          ) : (
            <>
              <div className="flex items-center justify-between border-b-[0.5px] border-border px-4 py-3">
                <h2 className="text-base">{labels.messages}</h2>
                <Link
                  href={`/${lng}/messages`}
                  aria-label={labels.openFull}
                  title={labels.openFull}
                  className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <ConversationList
                  lng={lng}
                  labels={labels.inbox}
                  embedded
                  onSelect={setConversationId}
                />
              </div>
            </>
          )}
        </div>
      ) : null}

      <button
        type="button"
        aria-label={buttonLabel}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90"
      >
        {open ? (
          <X className="size-6" aria-hidden="true" />
        ) : (
          <MessageCircle className="size-6" aria-hidden="true" />
        )}
        {!open && unread > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1.5 text-xs font-medium leading-none text-white"
          >
            {formatBadgeCount(unread)}
          </span>
        ) : null}
      </button>
    </div>
  );
}
