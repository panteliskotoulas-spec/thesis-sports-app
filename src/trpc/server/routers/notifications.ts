import { z } from 'zod';
import { protectedProcedure, router } from '../init';
import type { NotificationPage } from '@/lib/notifications/notification';
import { asLocalized } from '@/lib/server/booking-shared';

const listInput = z.object({
  lng: z.enum(['el', 'en']),
  limit: z.number().int().min(1).max(50),
  cursor: z.string().min(1).optional(),
});

const idInput = z.object({ id: z.string().min(1) });

function resolveMessage(value: unknown, lng: 'el' | 'en'): string {
  const text = asLocalized(value);
  return text[lng] || text.el || text.en;
}

export const notificationsRouter = router({
  list: protectedProcedure
    .input(listInput)
    .query(async ({ ctx, input }): Promise<NotificationPage> => {
      const rows = await ctx.prisma.notification.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });

      const hasMore = rows.length > input.limit;
      const page = hasMore ? rows.slice(0, input.limit) : rows;

      return {
        items: page.map((row) => ({
          id: row.id,
          type: row.type,
          message: resolveMessage(row.message, input.lng),
          linkUrl: row.linkUrl,
          isRead: row.isRead,
          createdAt: row.createdAt.toISOString(),
        })),
        nextCursor: hasMore ? page[page.length - 1].id : null,
      };
    }),

  unreadCount: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.notification.count({
      where: { userId: ctx.session.user.id, isRead: false },
    }),
  ),

  markRead: protectedProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.notification.updateMany({
        where: { id: input.id, userId: ctx.session.user.id, isRead: false },
        data: { isRead: true },
      });

      return { id: input.id };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await ctx.prisma.notification.updateMany({
      where: { userId: ctx.session.user.id, isRead: false },
      data: { isRead: true },
    });

    return { updated: result.count };
  }),
});
