import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@/generated/prisma/client';
import { protectedProcedure, router } from '../init';
import type { CoachSlotRow } from '@/lib/coaches/coach-public';
import {
  athensDateTime,
  athensDayRange,
  athensDayStart,
} from '@/lib/server/athens-time';

const idInput = z.object({ id: z.string().min(1) });

const dayInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeInput = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const listInput = z.object({ date: dayInput });

const createInput = z.object({
  date: dayInput,
  startTime: timeInput,
  endTime: timeInput,
  price: z.number().positive().max(9999.99),
});

export const coachSlotsRouter = router({
  list: protectedProcedure
    .input(listInput)
    .query(async ({ ctx, input }): Promise<CoachSlotRow[]> => {
      const coach = await ctx.prisma.coach.findUnique({
        where: { userId: ctx.session.user.id },
        select: { id: true },
      });

      if (!coach) throw new TRPCError({ code: 'NOT_FOUND' });

      const range = athensDayRange(input.date);

      const slots = await ctx.prisma.coachAvailabilitySlot.findMany({
        where: {
          coachId: coach.id,
          startTime: { gte: range.start, lt: range.end },
        },
        orderBy: { startTime: 'asc' },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          price: true,
          status: true,
        },
      });

      return slots.map((slot) => ({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        price: slot.price.toNumber(),
        status: slot.status,
      }));
    }),

  create: protectedProcedure
    .input(createInput)
    .mutation(async ({ ctx, input }) => {
      const coach = await ctx.prisma.coach.findUnique({
        where: { userId: ctx.session.user.id },
        select: { id: true, status: true },
      });

      if (!coach) throw new TRPCError({ code: 'NOT_FOUND' });
      if (coach.status !== 'APPROVED') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const startTime = athensDateTime(input.date, input.startTime);
      const endTime = athensDateTime(input.date, input.endTime);

      if (!startTime || !endTime) throw new TRPCError({ code: 'BAD_REQUEST' });
      if (endTime <= startTime) throw new TRPCError({ code: 'BAD_REQUEST' });
      if (startTime <= new Date()) throw new TRPCError({ code: 'BAD_REQUEST' });

      const price = Math.round(input.price * 100) / 100;

      try {
        const slot = await ctx.prisma.$transaction(
          async (tx) => {
            const overlapping = await tx.coachAvailabilitySlot.findFirst({
              where: {
                coachId: coach.id,
                startTime: { lt: endTime },
                endTime: { gt: startTime },
              },
              select: { id: true },
            });

            if (overlapping) throw new TRPCError({ code: 'CONFLICT' });

            return tx.coachAvailabilitySlot.create({
              data: {
                coachId: coach.id,
                date: athensDayStart(input.date),
                startTime,
                endTime,
                price,
              },
              select: { id: true },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        return { id: slot.id };
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034'
        ) {
          throw new TRPCError({ code: 'CONFLICT' });
        }
        throw error;
      }
    }),

  delete: protectedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const where = {
      id: input.id,
      coach: { userId: ctx.session.user.id },
    };

    const deleted = await ctx.prisma.coachAvailabilitySlot.deleteMany({
      where: { ...where, status: 'OPEN', session: { is: null } },
    });

    if (deleted.count > 0) return { id: input.id };

    const existing = await ctx.prisma.coachAvailabilitySlot.findFirst({
      where,
      select: { id: true },
    });

    if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });
    throw new TRPCError({ code: 'CONFLICT' });
  }),
});
