import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, publicProcedure, router } from '../init';

export const fieldsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.field.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const field = await ctx.prisma.field.findUnique({
        where: { id: input.id },
      });

      if (!field) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Field not found' });
      }

      return field;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        address: z.string().min(1),
        latitude: z.number(),
        longitude: z.number(),
        indoor: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.field.create({
        data: {
          ...input,
          ownerId: ctx.session.user.id,
        },
      });
    }),
});
