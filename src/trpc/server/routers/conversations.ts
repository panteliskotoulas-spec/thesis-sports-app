import { z } from 'zod';
import { protectedProcedure, router } from '../init';
import {
  CHAT_MESSAGE_MAX,
  type ChatConversation,
  type ChatMessage,
  type ChatThreadData,
} from '@/lib/chat/chat';
import {
  countUnreadMessages,
  getThread,
  listConversations,
  markConversationRead,
  openConversation,
  sendMessage,
} from '@/lib/server/chat-conversations';

const lngSchema = z.enum(['el', 'en']);

const listInput = z.object({ lng: lngSchema });

const threadInput = z.object({
  conversationId: z.string().min(1),
  lng: lngSchema,
  after: z.string().min(1).optional(),
  before: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(50),
});

const sendInput = z.object({
  conversationId: z.string().min(1),
  content: z.string().trim().min(1).max(CHAT_MESSAGE_MAX),
});

const readInput = z.object({ conversationId: z.string().min(1) });

const openInput = z.object({
  kind: z.enum(['team', 'coach']),
  id: z.string().min(1),
});

export const conversationsRouter = router({
  listMine: protectedProcedure
    .input(listInput)
    .query(
      ({ ctx, input }): Promise<ChatConversation[]> =>
        listConversations(ctx.prisma, ctx.session.user.id, input.lng),
    ),

  unreadCount: protectedProcedure.query(
    ({ ctx }): Promise<number> =>
      countUnreadMessages(ctx.prisma, ctx.session.user.id),
  ),

  getThread: protectedProcedure
    .input(threadInput)
    .query(
      ({ ctx, input }): Promise<ChatThreadData> =>
        getThread(ctx.prisma, ctx.session.user.id, input),
    ),

  send: protectedProcedure
    .input(sendInput)
    .mutation(
      ({ ctx, input }): Promise<ChatMessage> =>
        sendMessage(
          ctx.prisma,
          { id: ctx.session.user.id, name: ctx.session.user.name },
          input.conversationId,
          input.content,
        ),
    ),

  markRead: protectedProcedure
    .input(readInput)
    .mutation(async ({ ctx, input }) => {
      await markConversationRead(
        ctx.prisma,
        ctx.session.user.id,
        input.conversationId,
      );
      return { conversationId: input.conversationId };
    }),

  open: protectedProcedure
    .input(openInput)
    .mutation(({ ctx, input }) =>
      openConversation(ctx.prisma, ctx.session.user.id, input.kind, input.id),
    ),
});
