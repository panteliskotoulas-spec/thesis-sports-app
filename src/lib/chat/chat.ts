export const CHAT_MESSAGE_MAX = 1000;
export const CHAT_THREAD_PAGE_SIZE = 30;
export const CHAT_POLL_ACTIVE_MS = 4000;
export const CHAT_POLL_IDLE_MS = 20000;
export const CHAT_INBOX_POLL_MS = 10000;
export const CHAT_UNREAD_POLL_MS = 30000;
export const CHAT_UNREAD_EVENT = 'chat-unread-changed';

export type ChatKind = 'TEAM' | 'COACH';

export interface ChatLastMessage {
  content: string;
  senderName: string;
  isMine: boolean;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  kind: ChatKind;
  title: string;
  subtitle: string | null;
  logoUrl: string | null;
  memberCount: number | null;
  readOnly: boolean;
  unreadCount: number;
  lastMessage: ChatLastMessage | null;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  isMine: boolean;
  content: string;
  createdAt: string;
}

export interface ChatThreadData {
  conversation: ChatConversation;
  messages: ChatMessage[];
  hasMore: boolean;
}

export interface FetchThreadInput {
  conversationId: string;
  lng: 'el' | 'en';
  after?: string;
  before?: string;
  limit: number;
}

export interface SendMessageInput {
  conversationId: string;
  content: string;
}

export interface OpenConversationInput {
  kind: 'team' | 'coach';
  id: string;
}

export type OpenConversationResult =
  | { status: 'ok'; conversationId: string }
  | { status: 'unavailable' }
  | { status: 'error' };

export type FetchConversationsResult =
  | { status: 'ok'; items: ChatConversation[] }
  | { status: 'error' };

export type FetchThreadResult =
  | { status: 'ok'; thread: ChatThreadData }
  | { status: 'notFound' }
  | { status: 'error' };

export type SendMessageResult =
  | { status: 'ok'; message: ChatMessage }
  | { status: 'readOnly' }
  | { status: 'rateLimited' }
  | { status: 'notFound' }
  | { status: 'unauthorized' }
  | { status: 'error' };

const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Athens',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function athensDayKey(value: string | Date): string {
  return dayKeyFormatter.format(
    typeof value === 'string' ? new Date(value) : value,
  );
}

function shiftDayKey(key: string, days: number): string {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatMessageTime(value: string, lng: string): string {
  return new Intl.DateTimeFormat(lng, {
    timeZone: 'Europe/Athens',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export interface DayLabels {
  today: string;
  yesterday: string;
}

export function formatDayLabel(
  key: string,
  todayKey: string,
  lng: string,
  labels: DayLabels,
): string {
  if (key === todayKey) return labels.today;
  if (key === shiftDayKey(todayKey, -1)) return labels.yesterday;
  return new Intl.DateTimeFormat(lng, {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${key}T12:00:00Z`));
}

export function mergeMessages(
  current: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const message of current) byId.set(message.id, message);
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) =>
    a.createdAt === b.createdAt
      ? a.id.localeCompare(b.id)
      : a.createdAt.localeCompare(b.createdAt),
  );
}

export interface MessageDayGroup {
  key: string;
  items: ChatMessage[];
}

export function groupMessagesByDay(messages: ChatMessage[]): MessageDayGroup[] {
  const groups: MessageDayGroup[] = [];
  for (const message of messages) {
    const key = athensDayKey(message.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(message);
    } else {
      groups.push({ key, items: [message] });
    }
  }
  return groups;
}
