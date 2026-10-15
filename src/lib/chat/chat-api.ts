import type {
  FetchConversationsResult,
  FetchThreadInput,
  FetchThreadResult,
  SendMessageInput,
  SendMessageResult,
} from '@/lib/chat/chat';

export const fetchConversations: () => Promise<FetchConversationsResult> =
  async () => ({ status: 'error' });

export const fetchThread: (
  input: FetchThreadInput,
) => Promise<FetchThreadResult> = async () => ({ status: 'error' });

export const sendMessage: (
  input: SendMessageInput,
) => Promise<SendMessageResult> = async () => ({ status: 'error' });

export const markConversationRead: (
  conversationId: string,
) => Promise<void> = async () => undefined;
