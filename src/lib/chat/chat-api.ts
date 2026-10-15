import { createTRPCClient, httpBatchLink, TRPCClientError } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/trpc/server/routers/_app';
import { CHAT_UNREAD_EVENT } from '@/lib/chat/chat';
import type {
  FetchConversationsResult,
  FetchThreadInput,
  FetchThreadResult,
  OpenConversationInput,
  OpenConversationResult,
  SendMessageInput,
  SendMessageResult,
} from '@/lib/chat/chat';

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

function errorCode(error: unknown): string | null {
  if (error instanceof TRPCClientError) {
    return (error.data as { code?: string } | null | undefined)?.code ?? null;
  }
  return null;
}

export async function fetchConversations(
  lng: 'el' | 'en',
): Promise<FetchConversationsResult> {
  try {
    const items = await client.conversations.listMine.query({ lng });
    return { status: 'ok', items };
  } catch {
    return { status: 'error' };
  }
}

export async function fetchThread(
  input: FetchThreadInput,
): Promise<FetchThreadResult> {
  try {
    const thread = await client.conversations.getThread.query(input);
    return { status: 'ok', thread };
  } catch (error) {
    if (errorCode(error) === 'NOT_FOUND') return { status: 'notFound' };
    return { status: 'error' };
  }
}

export async function sendMessage(
  input: SendMessageInput,
): Promise<SendMessageResult> {
  try {
    const message = await client.conversations.send.mutate(input);
    return { status: 'ok', message };
  } catch (error) {
    const code = errorCode(error);
    if (code === 'CONFLICT') return { status: 'readOnly' };
    if (code === 'TOO_MANY_REQUESTS') return { status: 'rateLimited' };
    if (code === 'NOT_FOUND') return { status: 'notFound' };
    if (code === 'UNAUTHORIZED') return { status: 'unauthorized' };
    return { status: 'error' };
  }
}

export async function markConversationRead(
  conversationId: string,
): Promise<void> {
  try {
    await client.conversations.markRead.mutate({ conversationId });
    window.dispatchEvent(new Event(CHAT_UNREAD_EVENT));
  } catch {
    return;
  }
}

export async function fetchChatUnreadCount(): Promise<number | null> {
  try {
    return await client.conversations.unreadCount.query();
  } catch {
    return null;
  }
}

export async function openConversation(
  input: OpenConversationInput,
): Promise<OpenConversationResult> {
  try {
    const result = await client.conversations.open.mutate(input);
    return { status: 'ok', conversationId: result.conversationId };
  } catch (error) {
    const code = errorCode(error);
    if (code === 'NOT_FOUND') return { status: 'unavailable' };
    return { status: 'error' };
  }
}
