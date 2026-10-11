import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../init';
import { asLocalized } from '@/lib/server/booking-shared';
import { startSplitCheckout } from '@/lib/server/team-split-payment';
import type { TeamSplitPayRow } from '@/lib/teams/team-split';

const payInput = z.object({
  teamId: z.string().min(1),
  reservationId: z.string().min(1),
});

const startInput = z.object({
  reservationId: z.string().min(1),
  useCredit: z.boolean(),
  lng: z.enum(['el', 'en']),
});

export const splitsRouter = router({
  getForPay: protectedProcedure
    .input(payInput)
    .query(async ({ ctx, input }): Promise<TeamSplitPayRow> => {
      const userId = ctx.session.user.id;

      const reservation = await ctx.prisma.reservation.findFirst({
        where: {
          id: input.reservationId,
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
              field: { select: { id: true, name: true } },
            },
          },
        },
      });
      if (!reservation) throw new TRPCError({ code: 'NOT_FOUND' });

      const split = await ctx.prisma.paymentSplit.findUnique({
        where: {
          reservationId_userId: { reservationId: reservation.id, userId },
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
        fieldId: reservation.slot.field.id,
        fieldName: asLocalized(reservation.slot.field.name),
        startTime: reservation.slot.startTime,
        endTime: reservation.slot.endTime,
        leaderName: reservation.user.name,
        share: split.amount.toNumber(),
        balance: user ? user.creditBalance.toNumber() : 0,
      };
    }),

  startCheckout: protectedProcedure
    .input(startInput)
    .mutation(({ ctx, input }) =>
      startSplitCheckout(ctx.prisma, {
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email,
        reservationId: input.reservationId,
        useCredit: input.useCredit,
        lng: input.lng,
      }),
    ),
});
