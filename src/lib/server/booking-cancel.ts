import 'server-only';

import { TRPCError } from '@trpc/server';
import type { PrismaClient } from '@/generated/prisma/client';
import {
  canCancelBooking,
  type CompensationValue,
} from '@/lib/bookings/booking';
import { decimalToCents, money } from '@/lib/server/booking-shared';
import { getStripe } from '@/lib/server/stripe';

export interface CancelReservationParams {
  userId: string;
  reservationId: string;
  compensation: CompensationValue;
}

export async function cancelReservation(
  prisma: PrismaClient,
  params: CancelReservationParams,
): Promise<{ id: string }> {
  const now = new Date();

  const reservation = await prisma.reservation.findFirst({
    where: { id: params.reservationId, userId: params.userId },
    select: {
      id: true,
      slotId: true,
      status: true,
      slot: { select: { startTime: true } },
    },
  });

  if (!reservation) throw new TRPCError({ code: 'NOT_FOUND' });
  if (reservation.status !== 'CONFIRMED') {
    throw new TRPCError({ code: 'CONFLICT' });
  }
  if (!canCancelBooking(reservation.slot.startTime, now)) {
    throw new TRPCError({ code: 'PRECONDITION_FAILED' });
  }

  const payment = await prisma.payment.findFirst({
    where: { reservationId: reservation.id, status: 'SUCCEEDED' },
  });

  if (!payment) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

  const totalCents = decimalToCents(payment.amount);
  const creditCents = decimalToCents(payment.creditApplied);
  const cardCents = totalCents - creditCents;

  const refund = params.compensation === 'REFUND';
  if (refund && cardCents <= 0) throw new TRPCError({ code: 'BAD_REQUEST' });

  const refundCents = refund ? cardCents : 0;
  const creditBackCents = refund ? creditCents : totalCents;

  if (refundCents > 0 && !payment.stripePaymentIntentId) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
  }

  await prisma.$transaction(
    async (tx) => {
      const cancelled = await tx.reservation.updateMany({
        where: { id: reservation.id, status: 'CONFIRMED' },
        data: {
          status: 'CANCELLED',
          compensationType: params.compensation,
          cancelledAt: now,
        },
      });
      if (cancelled.count === 0) throw new TRPCError({ code: 'CONFLICT' });

      await tx.availabilitySlot.updateMany({
        where: { id: reservation.slotId, status: 'BOOKED' },
        data: { status: 'OPEN', holdExpiresAt: null },
      });

      if (creditBackCents > 0) {
        await tx.user.update({
          where: { id: params.userId },
          data: { creditBalance: { increment: money(creditBackCents) } },
        });

        await tx.creditTransaction.create({
          data: {
            userId: params.userId,
            amount: money(creditBackCents),
            type: 'EARNED_FROM_CANCELLATION',
            relatedReservationId: reservation.id,
          },
        });
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED' },
      });

      if (refundCents > 0 && payment.stripePaymentIntentId) {
        await getStripe().refunds.create(
          {
            payment_intent: payment.stripePaymentIntentId,
            amount: refundCents,
          },
          { idempotencyKey: `refund-reservation-${reservation.id}` },
        );
      }
    },
    { timeout: 15_000 },
  );

  return { id: reservation.id };
}
