import 'server-only';

import { TRPCError } from '@trpc/server';
import type { PrismaClient, Prisma } from '@/generated/prisma/client';
import {
  canCancelBooking,
  type CancelledByValue,
  type CompensationValue,
} from '@/lib/bookings/booking';
import {
  ownerBookingCancelledMessage,
  reservationCancelledByOwnerMessage,
  reservationCancelledMessage,
} from '@/lib/server/booking-notifications';
import {
  asLocalized,
  decimalToCents,
  money,
} from '@/lib/server/booking-shared';
import { getStripe } from '@/lib/server/stripe';

export interface CancelReservationParams {
  userId: string;
  reservationId: string;
  compensation: CompensationValue;
}

export interface CancelReservationByOwnerParams {
  ownerId: string;
  reservationId: string;
}

const reservationSelect = {
  id: true,
  slotId: true,
  status: true,
  userId: true,
  user: { select: { name: true } },
  slot: {
    select: {
      startTime: true,
      endTime: true,
      field: { select: { name: true, ownerId: true } },
    },
  },
} satisfies Prisma.ReservationSelect;

type CancellableReservation = Prisma.ReservationGetPayload<{
  select: typeof reservationSelect;
}>;

interface CancellationPlan {
  reservation: CancellableReservation;
  paymentId: string;
  paymentIntentId: string | null;
  compensation: CompensationValue;
  refundCents: number;
  creditBackCents: number;
  cancelledBy: CancelledByValue;
  now: Date;
}

async function executeCancellation(
  prisma: PrismaClient,
  plan: CancellationPlan,
): Promise<{ id: string }> {
  const { reservation } = plan;
  const fieldName = asLocalized(reservation.slot.field.name);
  const outcome =
    plan.refundCents === 0
      ? 'credit'
      : plan.creditBackCents > 0
        ? 'mixed'
        : 'card';

  await prisma.$transaction(
    async (tx) => {
      const cancelled = await tx.reservation.updateMany({
        where: { id: reservation.id, status: 'CONFIRMED' },
        data: {
          status: 'CANCELLED',
          compensationType: plan.compensation,
          cancelledAt: plan.now,
          cancelledBy: plan.cancelledBy,
        },
      });
      if (cancelled.count === 0) throw new TRPCError({ code: 'CONFLICT' });

      if (plan.cancelledBy === 'PLAYER') {
        await tx.availabilitySlot.updateMany({
          where: { id: reservation.slotId, status: 'BOOKED' },
          data: { status: 'OPEN', holdExpiresAt: null },
        });
      }

      if (plan.creditBackCents > 0) {
        await tx.user.update({
          where: { id: reservation.userId },
          data: { creditBalance: { increment: money(plan.creditBackCents) } },
        });

        await tx.creditTransaction.create({
          data: {
            userId: reservation.userId,
            amount: money(plan.creditBackCents),
            type: 'EARNED_FROM_CANCELLATION',
            relatedReservationId: reservation.id,
          },
        });
      }

      await tx.payment.update({
        where: { id: plan.paymentId },
        data: { status: 'REFUNDED' },
      });

      await tx.notification.create({
        data: {
          userId: reservation.userId,
          type: 'RESERVATION_CANCELLED',
          message:
            plan.cancelledBy === 'OWNER'
              ? reservationCancelledByOwnerMessage(
                  fieldName,
                  reservation.slot.startTime,
                  reservation.slot.endTime,
                  outcome,
                )
              : reservationCancelledMessage(
                  fieldName,
                  reservation.slot.startTime,
                  reservation.slot.endTime,
                  outcome,
                ),
          linkUrl: `/bookings?focus=${reservation.id}`,
        },
      });

      if (
        plan.cancelledBy === 'PLAYER' &&
        reservation.slot.field.ownerId !== reservation.userId
      ) {
        await tx.notification.create({
          data: {
            userId: reservation.slot.field.ownerId,
            type: 'RESERVATION_CANCELLED',
            message: ownerBookingCancelledMessage(
              fieldName,
              reservation.user.name,
              reservation.slot.startTime,
              reservation.slot.endTime,
            ),
            linkUrl: '/owner/bookings',
          },
        });
      }

      if (plan.refundCents > 0 && plan.paymentIntentId) {
        await getStripe().refunds.create(
          {
            payment_intent: plan.paymentIntentId,
            amount: plan.refundCents,
          },
          { idempotencyKey: `refund-reservation-${reservation.id}` },
        );
      }
    },
    { timeout: 15_000 },
  );

  return { id: reservation.id };
}

export async function cancelReservation(
  prisma: PrismaClient,
  params: CancelReservationParams,
): Promise<{ id: string }> {
  const now = new Date();

  const reservation = await prisma.reservation.findFirst({
    where: { id: params.reservationId, userId: params.userId },
    select: reservationSelect,
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

  return executeCancellation(prisma, {
    reservation,
    paymentId: payment.id,
    paymentIntentId: payment.stripePaymentIntentId,
    compensation: params.compensation,
    refundCents,
    creditBackCents,
    cancelledBy: 'PLAYER',
    now,
  });
}

export async function cancelReservationByOwner(
  prisma: PrismaClient,
  params: CancelReservationByOwnerParams,
): Promise<{ id: string }> {
  const now = new Date();

  const reservation = await prisma.reservation.findFirst({
    where: {
      id: params.reservationId,
      slot: { field: { ownerId: params.ownerId } },
    },
    select: reservationSelect,
  });

  if (!reservation) throw new TRPCError({ code: 'NOT_FOUND' });
  if (reservation.status !== 'CONFIRMED') {
    throw new TRPCError({ code: 'CONFLICT' });
  }
  if (reservation.slot.endTime <= now) {
    throw new TRPCError({ code: 'CONFLICT' });
  }

  const payment = await prisma.payment.findFirst({
    where: { reservationId: reservation.id, status: 'SUCCEEDED' },
  });

  if (!payment) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

  const totalCents = decimalToCents(payment.amount);
  const creditCents = decimalToCents(payment.creditApplied);
  const cardCents = totalCents - creditCents;

  if (cardCents > 0 && !payment.stripePaymentIntentId) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
  }

  return executeCancellation(prisma, {
    reservation,
    paymentId: payment.id,
    paymentIntentId: payment.stripePaymentIntentId,
    compensation: cardCents > 0 ? 'REFUND' : 'CREDIT',
    refundCents: cardCents,
    creditBackCents: creditCents,
    cancelledBy: 'OWNER',
    now,
  });
}
