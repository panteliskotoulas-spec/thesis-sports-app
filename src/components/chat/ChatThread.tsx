'use client';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import Link from 'next/link';
import { Lock, Send } from 'lucide-react';
import { TeamAvatar } from '@/components/teams/TeamAvatar';
import { fillTemplate } from '@/lib/bookings/booking';
import {
  fetchThread,
  markConversationRead,
  sendMessage,
} from '@/lib/chat/chat-api';
import {
  athensDayKey,
  CHAT_MESSAGE_MAX,
  CHAT_POLL_ACTIVE_MS,
  CHAT_POLL_IDLE_MS,
  CHAT_THREAD_PAGE_SIZE,
  formatDayLabel,
  formatMessageTime,
  groupMessagesByDay,
  mergeMessages,
  type ChatConversation,
  type ChatMessage,
} from '@/lib/chat/chat';
import { MessageBubble } from './MessageBubble';

export interface ChatThreadLabels {
  back: string;
  membersOne: string;
  membersOther: string;
  loading: string;
  notFound: string;
  error: string;
  retry: string;
  empty: string;
  loadOlder: string;
  loadingOlder: string;
  loadOlderError: string;
  today: string;
  yesterday: string;
  you: string;
  composerLabel: string;
  placeholder: string;
  send: string;
  sending: string;
  counter: string;
  readOnly: string;
  errorEmpty: string;
  errorTooLong: string;
  errorRateLimited: string;
  errorReadOnly: string;
  errorUnauthorized: string;
  errorGeneric: string;
}

export interface ChatThreadProps {
  lng: 'el' | 'en';
  conversationId: string;
  backHref: string;
  labels: ChatThreadLabels;
}

type Phase = 'loading' | 'ready' | 'notFound' | 'error';

export function ChatThread({
  lng,
  conversationId,
  backHref,
  labels,
}: ChatThreadProps) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [attempt, setAttempt] = useState(0);
  const [conversation, setConversation] = useState<ChatConversation | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [olderBusy, setOlderBusy] = useState(false);
  const [olderError, setOlderError] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [todayKey, setTodayKey] = useState(() => athensDayKey(new Date()));

  const listRef = useRef<HTMLDivElement | null>(null);
  const stickRef = useRef(true);
  const anchorRef = useRef<number | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const result = await fetchThread({
        conversationId,
        lng,
        limit: CHAT_THREAD_PAGE_SIZE,
      });
      if (cancelled) return;

      if (result.status === 'notFound') {
        setPhase('notFound');
        return;
      }
      if (result.status !== 'ok') {
        setPhase('error');
        return;
      }

      stickRef.current = true;
      setConversation(result.thread.conversation);
      setMessages(result.thread.messages);
      setHasMore(result.thread.hasMore);
      setPhase('ready');
      void markConversationRead(conversationId);
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [conversationId, lng, attempt]);

  useEffect(() => {
    if (phase !== 'ready') return;

    let cancelled = false;
    let inflight = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function schedule() {
      const delay =
        document.visibilityState === 'visible'
          ? CHAT_POLL_ACTIVE_MS
          : CHAT_POLL_IDLE_MS;
      timer = setTimeout(() => {
        void tick();
      }, delay);
    }

    async function tick() {
      if (cancelled || inflight) return;
      inflight = true;

      const known = messagesRef.current;
      const last = known[known.length - 1];
      const result = await fetchThread({
        conversationId,
        lng,
        after: last?.id,
        limit: CHAT_THREAD_PAGE_SIZE,
      });

      inflight = false;
      if (cancelled) return;

      if (result.status === 'ok') {
        setTodayKey(athensDayKey(new Date()));
        setConversation(result.thread.conversation);
        const incoming = result.thread.messages;
        if (incoming.length > 0) {
          setMessages((current) => mergeMessages(current, incoming));
          if (incoming.some((message) => !message.isMine)) {
            void markConversationRead(conversationId);
          }
        }
      }

      schedule();
    }

    function handleVisibility() {
      if (document.visibilityState !== 'visible') return;
      clearTimeout(timer);
      void tick();
    }

    document.addEventListener('visibilitychange', handleVisibility);
    schedule();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [phase, conversationId, lng]);

  useLayoutEffect(() => {
    const element = listRef.current;
    if (!element) return;

    if (anchorRef.current !== null) {
      element.scrollTop += element.scrollHeight - anchorRef.current;
      anchorRef.current = null;
      return;
    }

    if (stickRef.current) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages, phase]);

  const groups = useMemo(() => groupMessagesByDay(messages), [messages]);

  function handleScroll() {
    const element = listRef.current;
    if (!element) return;
    stickRef.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < 80;
  }

  function handleRetry() {
    setPhase('loading');
    setAttempt((value) => value + 1);
  }

  async function handleOlder() {
    if (olderBusy || messages.length === 0) return;

    setOlderBusy(true);
    setOlderError(false);

    const result = await fetchThread({
      conversationId,
      lng,
      before: messages[0].id,
      limit: CHAT_THREAD_PAGE_SIZE,
    });

    if (result.status === 'ok') {
      anchorRef.current = listRef.current?.scrollHeight ?? null;
      setMessages((current) => mergeMessages(current, result.thread.messages));
      setHasMore(result.thread.hasMore);
    } else {
      setOlderError(true);
    }

    setOlderBusy(false);
  }

  async function handleSend() {
    if (sending || !conversation || conversation.readOnly) return;

    const content = draft.trim();

    if (!content) {
      setSendError(labels.errorEmpty);
      return;
    }
    if (content.length > CHAT_MESSAGE_MAX) {
      setSendError(
        fillTemplate(labels.errorTooLong, { max: String(CHAT_MESSAGE_MAX) }),
      );
      return;
    }

    setSending(true);
    setSendError(null);

    const result = await sendMessage({ conversationId, content });

    if (result.status === 'ok') {
      stickRef.current = true;
      setMessages((current) => mergeMessages(current, [result.message]));
      setDraft('');
    } else if (result.status === 'readOnly') {
      setConversation((current) =>
        current ? { ...current, readOnly: true } : current,
      );
      setSendError(labels.errorReadOnly);
    } else if (result.status === 'rateLimited') {
      setSendError(labels.errorRateLimited);
    } else if (result.status === 'unauthorized') {
      setSendError(labels.errorUnauthorized);
    } else {
      setSendError(labels.errorGeneric);
    }

    setSending(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return;
    if (event.nativeEvent.isComposing) return;
    event.preventDefault();
    void handleSend();
  }

  if (phase === 'loading') {
    return (
      <p role="status" className="text-muted-foreground">
        {labels.loading}
      </p>
    );
  }

  if (phase === 'notFound') {
    return (
      <div className="rounded-xl border-[0.5px] border-border bg-card p-6">
        <p className="text-muted-foreground">{labels.notFound}</p>
        <Link
          href={backHref}
          className="mt-4 inline-flex h-11 items-center rounded-full border-[0.5px] border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-secondary"
        >
          {labels.back}
        </Link>
      </div>
    );
  }

  if (phase === 'error' || !conversation) {
    return (
      <div className="rounded-xl border-[0.5px] border-border bg-card p-6">
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

  const subtitle =
    conversation.kind === 'TEAM' && conversation.memberCount !== null
      ? fillTemplate(
          conversation.memberCount === 1
            ? labels.membersOne
            : labels.membersOther,
          { count: String(conversation.memberCount) },
        )
      : conversation.subtitle;

  return (
    <section className="flex h-[min(70dvh,680px)]  min-h-105 flex-col overflow-hidden rounded-xl border-[0.5px] border-border bg-card">
      <header className="flex items-center gap-3 border-b-[0.5px] border-border px-4 py-3">
        <TeamAvatar
          name={conversation.title}
          logoUrl={conversation.logoUrl}
          size="sm"
        />
        <div className="min-w-0">
          <h1 className="truncate text-base">{conversation.title}</h1>
          {subtitle ? (
            <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </header>

      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-background px-4 py-4"
      >
        {hasMore ? (
          <div className="mb-3 flex flex-col items-center">
            <button
              type="button"
              disabled={olderBusy}
              onClick={handleOlder}
              className="h-10 rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {olderBusy ? labels.loadingOlder : labels.loadOlder}
            </button>
            {olderError ? (
              <p role="alert" className="mt-2 text-sm text-destructive">
                {labels.loadOlderError}
              </p>
            ) : null}
          </div>
        ) : null}

        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {labels.empty}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {groups.map((group) => (
              <li key={group.key} className="contents">
                <p className="my-2 self-center text-xs text-muted-foreground">
                  {formatDayLabel(group.key, todayKey, lng, labels)}
                </p>
                <ul className="flex flex-col gap-2">
                  {group.items.map((message, index) => {
                    const previous = group.items[index - 1];
                    const showSender =
                      conversation.kind === 'TEAM' &&
                      (!previous || previous.senderId !== message.senderId);

                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        time={formatMessageTime(message.createdAt, lng)}
                        showSender={showSender}
                        youLabel={labels.you}
                      />
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      {conversation.readOnly ? (
        <p className="flex items-center gap-2 border-t-[0.5px] border-border px-4 py-3 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" aria-hidden="true" />
          {labels.readOnly}
        </p>
      ) : (
        <div className="border-t-[0.5px] border-border px-4 py-3">
          <div className="flex items-end gap-2">
            <label htmlFor="chat-message" className="sr-only">
              {labels.composerLabel}
            </label>
            <textarea
              id="chat-message"
              rows={1}
              value={draft}
              maxLength={CHAT_MESSAGE_MAX}
              placeholder={labels.placeholder}
              aria-describedby={sendError ? 'chat-message-error' : undefined}
              onChange={(event) => {
                setDraft(event.target.value);
                setSendError(null);
              }}
              onKeyDown={handleKeyDown}
              className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border-[0.5px] border-input bg-card px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={sending}
              onClick={() => void handleSend()}
              aria-label={sending ? labels.sending : labels.send}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-1.5 flex items-start justify-between gap-3 text-xs">
            <p
              id="chat-message-error"
              role="alert"
              className="text-destructive"
            >
              {sendError}
            </p>
            <p className="shrink-0 text-muted-foreground">
              {fillTemplate(labels.counter, {
                count: String(draft.length),
                max: String(CHAT_MESSAGE_MAX),
              })}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
