import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../init';
import type {
  BookingRow,
  BookingSummaryRow,
} from '@/lib/bookings/booking-rows';
import { cancelReservation } from '@/lib/server/booking-cancel';
import { startCheckout } from '@/lib/server/booking-checkout';
import { asLocalized, decimalToCents } from '@/lib/server/booking-shared';

const startCheckoutInput = z.object({
  slotId: z.string().min(1),
  useCredit: z.boolean(),
  lng: z.enum(['el', 'en']),
});

const cancelInput = z.object({
  reservationId: z.string().min(1),
  compensation: z.enum(['REFUND', 'CREDIT']),
});

const summaryInput = z.object({ slotId: z.string().min(1) });

export const reservationsRouter = router({
  getSummary: protectedProcedure
    .input(summaryInput)
    .query(async ({ ctx, input }): Promise<BookingSummaryRow> => {
      const now = new Date();

      const slot = await ctx.prisma.availabilitySlot.findUnique({
        where: { id: input.slotId },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          price: true,
          sportType: true,
          status: true,
          holdExpiresAt: true,
          field: {
            select: {
              id: true,
              name: true,
              address: true,
              status: true,
              archivedAt: true,
            },
          },
        },
      });

      if (!slot || slot.field.status !== 'APPROVED' || slot.field.archivedAt) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { creditBalance: true },
      });

      const holdExpired =
        slot.status === 'PENDING_PAYMENT' &&
        slot.holdExpiresAt !== null &&
        slot.holdExpiresAt < now;

      return {
        slotId: slot.id,
        fieldId: slot.field.id,
        fieldName: asLocalized(slot.field.name),
        address: slot.field.address,
        startTime: slot.startTime,
        endTime: slot.endTime,
        price: slot.price.toNumber(),
        sportType: slot.sportType,
        balance: user ? user.creditBalance.toNumber() : 0,
        available:
          slot.startTime > now && (slot.status === 'OPEN' || holdExpired),
      };
    }),

  startCheckout: protectedProcedure
    .input(startCheckoutInput)
    .mutation(({ ctx, input }) =>
      startCheckout(ctx.prisma, {
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email,
        slotId: input.slotId,
        useCredit: input.useCredit,
        lng: input.lng,
      }),
    ),

  cancel: protectedProcedure.input(cancelInput).mutation(({ ctx, input }) =>
    cancelReservation(ctx.prisma, {
      userId: ctx.session.user.id,
      reservationId: input.reservationId,
      compensation: input.compensation,
    }),
  ),

  listMine: protectedProcedure.query(async ({ ctx }): Promise<BookingRow[]> => {
    const reservations = await ctx.prisma.reservation.findMany({
      where: { userId: ctx.session.user.id },
      select: {
        id: true,
        status: true,
        compensationType: true,
        slot: {
          select: {
            startTime: true,
            endTime: true,
            sportType: true,
            field: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (reservations.length === 0) return [];

    const payments = await ctx.prisma.payment.findMany({
      where: { reservationId: { in: reservations.map((item) => item.id) } },
      select: { reservationId: true, amount: true, creditApplied: true },
    });

    const byReservation = new Map(
      payments.map((payment) => [payment.reservationId, payment] as const),
    );

    return reservations.flatMap((reservation) => {
      const payment = byReservation.get(reservation.id);
      if (!payment) return [];

      return [
        {
          id: reservation.id,
          fieldId: reservation.slot.field.id,
          fieldName: asLocalized(reservation.slot.field.name),
          sportType: reservation.slot.sportType,
          startTime: reservation.slot.startTime,
          endTime: reservation.slot.endTime,
          status: reservation.status,
          compensation: reservation.compensationType,
          total: decimalToCents(payment.amount) / 100,
          credit: decimalToCents(payment.creditApplied) / 100,
        },
      ];
    });
  }),
});
