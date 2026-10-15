import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../init';
import { startSessionSplitCheckout } from '@/lib/server/session-split-payment';
import type { SessionSplitPayRow } from '@/lib/teams/team-split';

const payInput = z.object({
  teamId: z.string().min(1),
  sessionId: z.string().min(1),
});

const startInput = z.object({
  sessionId: z.string().min(1),
  useCredit: z.boolean(),
  lng: z.enum(['el', 'en']),
});

export const sessionSplitsRouter = router({
  getForPay: protectedProcedure
    .input(payInput)
    .query(async ({ ctx, input }): Promise<SessionSplitPayRow> => {
      const userId = ctx.session.user.id;

      const coaching = await ctx.prisma.coachingSession.findFirst({
        where: {
          id: input.sessionId,
          teamId: input.teamId,
          status: 'CONFIRMED',
          slot: { endTime: { gt: new Date() } },
        },
        select: {
          id: true,
          user: { select: { name: true } },
          slot: {
            select: {
              startTime: true,
              endTime: true,
              coach: {
                select: { id: true, user: { select: { name: true } } },
              },
            },
          },
        },
      });
      if (!coaching) throw new TRPCError({ code: 'NOT_FOUND' });

      const split = await ctx.prisma.sessionSplit.findUnique({
        where: {
          coachingSessionId_userId: { coachingSessionId: coaching.id, userId },
        },
        select: { id: true, amount: true, status: true },
      });
      if (!split || split.status !== 'PENDING') {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { creditBalance: true },
      });

      return {
        splitId: split.id,
        coachId: coaching.slot.coach.id,
        coachName: coaching.slot.coach.user.name,
        startTime: coaching.slot.startTime,
        endTime: coaching.slot.endTime,
        leaderName: coaching.user.name,
        share: split.amount.toNumber(),
        balance: user ? user.creditBalance.toNumber() : 0,
      };
    }),

  startCheckout: protectedProcedure
    .input(startInput)
    .mutation(({ ctx, input }) =>
      startSessionSplitCheckout(ctx.prisma, {
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email,
        sessionId: input.sessionId,
        useCredit: input.useCredit,
        lng: input.lng,
      }),
    ),
});
