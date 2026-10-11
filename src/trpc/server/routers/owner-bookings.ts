import { z } from 'zod';
import { protectedProcedure, router } from '../init';
import type { OwnerBookingRow } from '@/lib/bookings/owner-booking';
import { cancelReservationByOwner } from '@/lib/server/booking-cancel';
import { asLocalized, decimalToCents } from '@/lib/server/booking-shared';

const cancelInput = z.object({ reservationId: z.string().min(1) });

export const ownerBookingsRouter = router({
  list: protectedProcedure.query(
    async ({ ctx }): Promise<OwnerBookingRow[]> => {
      const reservations = await ctx.prisma.reservation.findMany({
        where: { slot: { field: { ownerId: ctx.session.user.id } } },
        select: {
          id: true,
          status: true,
          cancelledBy: true,
          user: { select: { name: true } },
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
            cancelledBy: reservation.cancelledBy,
            playerName: reservation.user.name,
            total: decimalToCents(payment.amount) / 100,
            credit: decimalToCents(payment.creditApplied) / 100,
          },
        ];
      });
    },
  ),

  cancel: protectedProcedure.input(cancelInput).mutation(({ ctx, input }) =>
    cancelReservationByOwner(ctx.prisma, {
      ownerId: ctx.session.user.id,
      reservationId: input.reservationId,
    }),
  ),
});
