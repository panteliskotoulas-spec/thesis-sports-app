import 'server-only';

import { TRPCError } from '@trpc/server';
import type Stripe from 'stripe';
import type { PrismaClient } from '@/generated/prisma/client';
import { computePaymentSplit } from '@/lib/bookings/payment-split';
import { formatDayChip, formatTimeRange } from '@/lib/fields/detail-format';
import { todayInAthens } from '@/lib/fields/filters';
import { localized } from '@/lib/i18n-content';
import {
  AlreadyHandled,
  asLocalized,
  availableSlotWhere,
  BookingAbort,
  CHECKOUT_EXPIRES_MINUTES,
  decimalToCents,
  money,
  SLOT_HOLD_MINUTES,
} from '@/lib/server/booking-shared';
import { reservationConfirmedMessage } from '@/lib/server/booking-notifications';
import { getAppUrl, getStripe } from '@/lib/server/stripe';

export interface StartCheckoutParams {
  userId: string;
  userEmail: string;
  slotId: string;
  useCredit: boolean;
  lng: 'el' | 'en';
}

export type ConfirmResult =
  | { status: 'confirmed' }
  | { status: 'pending' }
  | { status: 'refunded' }
  | { status: 'invalid' };

function paymentIntentId(session: Stripe.Checkout.Session): string | null {
  const intent = session.payment_intent;
  if (typeof intent === 'string') return intent;
  return intent?.id ?? null;
}

async function refundSession(
  session: Stripe.Checkout.Session,
  paymentId: string,
): Promise<void> {
  const intent = paymentIntentId(session);
  if (!intent) throw new Error('Paid session without payment intent');

  await getStripe().refunds.create(
    { payment_intent: intent },
    { idempotencyKey: `refund-payment-${paymentId}` },
  );
}

export async function releaseHold(
  prisma: PrismaClient,
  paymentId: string,
): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, status: true, slotId: true, holdExpiresAt: true },
  });

  if (!payment || payment.status !== 'PENDING') return;

  await prisma.$transaction(async (tx) => {
    const failed = await tx.payment.updateMany({
      where: { id: payment.id, status: 'PENDING' },
      data: { status: 'FAILED' },
    });

    if (failed.count === 0) return;

    if (payment.slotId && payment.holdExpiresAt) {
      await tx.availabilitySlot.updateMany({
        where: {
          id: payment.slotId,
          status: 'PENDING_PAYMENT',
          holdExpiresAt: payment.holdExpiresAt,
        },
        data: { status: 'OPEN', holdExpiresAt: null },
      });
    }
  });
}

export async function confirmCheckoutSession(
  prisma: PrismaClient,
  sessionId: string,
): Promise<ConfirmResult> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);

  const paymentId = session.metadata?.paymentId;
  if (!paymentId) return { status: 'invalid' };

  if (session.payment_status !== 'paid') {
    return { status: session.status === 'expired' ? 'invalid' : 'pending' };
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment || !payment.slotId || !payment.userId) {
    return { status: 'invalid' };
  }
  if (payment.sessionId !== session.id) return { status: 'invalid' };
  if (session.metadata?.userId !== payment.userId) return { status: 'invalid' };

  const creditCents = decimalToCents(payment.creditApplied);
  const cardCents = decimalToCents(payment.amount) - creditCents;
  if (session.amount_total !== cardCents) return { status: 'invalid' };

  if (payment.status === 'SUCCEEDED') return { status: 'confirmed' };
  if (payment.status === 'REFUNDED') return { status: 'refunded' };

  if (payment.status === 'FAILED') {
    await refundSession(session, payment.id);
    return { status: 'refunded' };
  }

  const slot = await prisma.availabilitySlot.findUnique({
    where: { id: payment.slotId },
    select: {
      startTime: true,
      endTime: true,
      field: { select: { name: true } },
    },
  });

  if (!slot) {
    await refundSession(session, payment.id);
    await prisma.payment.updateMany({
      where: { id: payment.id, status: 'PENDING' },
      data: { status: 'FAILED' },
    });
    return { status: 'refunded' };
  }

  const slotId = payment.slotId;
  const userId = payment.userId;

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.payment.updateMany({
        where: { id: payment.id, status: 'PENDING' },
        data: {
          status: 'SUCCEEDED',
          stripePaymentIntentId: paymentIntentId(session),
        },
      });
      if (claimed.count === 0) throw new AlreadyHandled();

      const booked = await tx.availabilitySlot.updateMany({
        where: {
          id: slotId,
          status: 'PENDING_PAYMENT',
          holdExpiresAt: payment.holdExpiresAt,
        },
        data: { status: 'BOOKED', holdExpiresAt: null },
      });
      if (booked.count === 0) throw new BookingAbort('slot_lost');

      if (creditCents > 0) {
        const charged = await tx.user.updateMany({
          where: { id: userId, creditBalance: { gte: money(creditCents) } },
          data: { creditBalance: { decrement: money(creditCents) } },
        });
        if (charged.count === 0) throw new BookingAbort('credit_short');
      }

      const reservation = await tx.reservation.create({
        data: { slotId, userId },
        select: { id: true },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: { reservationId: reservation.id },
      });

      if (creditCents > 0) {
        await tx.creditTransaction.create({
          data: {
            userId,
            amount: money(-creditCents),
            type: 'SPENT_ON_BOOKING',
            relatedReservationId: reservation.id,
          },
        });
      }

      await tx.notification.create({
        data: {
          userId,
          type: 'RESERVATION_CONFIRMED',
          message: reservationConfirmedMessage(
            asLocalized(slot.field.name),
            slot.startTime,
            slot.endTime,
          ),
          linkUrl: '/bookings',
        },
      });
    });

    return { status: 'confirmed' };
  } catch (error) {
    if (error instanceof AlreadyHandled) {
      return confirmCheckoutSession(prisma, sessionId);
    }

    if (error instanceof BookingAbort) {
      await refundSession(session, payment.id);
      await releaseHold(prisma, payment.id);
      return { status: 'refunded' };
    }

    throw error;
  }
}

export async function abandonPayment(
  prisma: PrismaClient,
  payment: { id: string; sessionId: string | null },
): Promise<'confirmed' | 'released'> {
  if (payment.sessionId) {
    const stripe = getStripe();

    try {
      await stripe.checkout.sessions.expire(payment.sessionId);
    } catch {
      const session = await stripe.checkout.sessions.retrieve(
        payment.sessionId,
      );

      if (session.status === 'complete') {
        const result = await confirmCheckoutSession(prisma, payment.sessionId);
        return result.status === 'confirmed' ? 'confirmed' : 'released';
      }
    }
  }

  await releaseHold(prisma, payment.id);
  return 'released';
}

export async function startCheckout(
  prisma: PrismaClient,
  params: StartCheckoutParams,
): Promise<{ url: string | null }> {
  const now = new Date();

  const slot = await prisma.availabilitySlot.findUnique({
    where: { id: params.slotId },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      price: true,
      field: {
        select: { id: true, name: true, status: true, archivedAt: true },
      },
    },
  });

  if (!slot || slot.field.status !== 'APPROVED' || slot.field.archivedAt) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }
  if (slot.startTime <= now) throw new TRPCError({ code: 'BAD_REQUEST' });

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { creditBalance: true },
  });

  if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });

  const priceCents = decimalToCents(slot.price);
  const split = computePaymentSplit(
    priceCents,
    decimalToCents(user.creditBalance),
    params.useCredit,
  );

  if (!split.valid) throw new TRPCError({ code: 'BAD_REQUEST' });

  const previous = await prisma.payment.findMany({
    where: { userId: params.userId, slotId: slot.id, status: 'PENDING' },
    select: { id: true, sessionId: true },
  });

  for (const payment of previous) {
    const outcome = await abandonPayment(prisma, payment);
    if (outcome === 'confirmed') return { url: null };
  }

  if (split.cardCents === 0) {
    await prisma.$transaction(async (tx) => {
      const booked = await tx.availabilitySlot.updateMany({
        where: { id: slot.id, ...availableSlotWhere(now) },
        data: { status: 'BOOKED', holdExpiresAt: null },
      });
      if (booked.count === 0) throw new TRPCError({ code: 'CONFLICT' });

      const charged = await tx.user.updateMany({
        where: {
          id: params.userId,
          creditBalance: { gte: money(split.creditCents) },
        },
        data: { creditBalance: { decrement: money(split.creditCents) } },
      });
      if (charged.count === 0) throw new TRPCError({ code: 'BAD_REQUEST' });

      const reservation = await tx.reservation.create({
        data: { slotId: slot.id, userId: params.userId },
        select: { id: true },
      });

      await tx.payment.create({
        data: {
          reservationId: reservation.id,
          userId: params.userId,
          slotId: slot.id,
          amount: money(priceCents),
          platformFee: 0,
          ownerPayout: money(priceCents),
          method: 'CREDIT',
          creditApplied: money(split.creditCents),
          status: 'SUCCEEDED',
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: params.userId,
          amount: money(-split.creditCents),
          type: 'SPENT_ON_BOOKING',
          relatedReservationId: reservation.id,
        },
      });

      await tx.notification.create({
        data: {
          userId: params.userId,
          type: 'RESERVATION_CONFIRMED',
          message: reservationConfirmedMessage(
            asLocalized(slot.field.name),
            slot.startTime,
            slot.endTime,
          ),
          linkUrl: '/bookings',
        },
      });
    });

    return { url: null };
  }

  const holdExpiresAt = new Date(now.getTime() + SLOT_HOLD_MINUTES * 60_000);

  const payment = await prisma.$transaction(async (tx) => {
    const held = await tx.availabilitySlot.updateMany({
      where: { id: slot.id, ...availableSlotWhere(now) },
      data: { status: 'PENDING_PAYMENT', holdExpiresAt },
    });
    if (held.count === 0) throw new TRPCError({ code: 'CONFLICT' });

    return tx.payment.create({
      data: {
        userId: params.userId,
        slotId: slot.id,
        holdExpiresAt,
        amount: money(priceCents),
        platformFee: 0,
        ownerPayout: money(priceCents),
        method: split.method,
        creditApplied: money(split.creditCents),
        status: 'PENDING',
      },
      select: { id: true },
    });
  });

  const fieldName = localized(asLocalized(slot.field.name), params.lng);
  const day = todayInAthens(slot.startTime);
  const description = `${formatDayChip(day, params.lng).full}, ${formatTimeRange(slot.startTime, slot.endTime, params.lng)}`;
  const base = getAppUrl();

  let sessionId: string | null = null;

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      submit_type: 'book',
      locale: params.lng,
      customer_email: params.userEmail,
      client_reference_id: payment.id,
      expires_at: Math.floor(
        (Date.now() + CHECKOUT_EXPIRES_MINUTES * 60_000) / 1000,
      ),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: split.cardCents,
            product_data: { name: fieldName, description },
          },
        },
      ],
      metadata: {
        paymentId: payment.id,
        slotId: slot.id,
        userId: params.userId,
      },
      success_url: `${base}/api/stripe/return?status=success&session_id={CHECKOUT_SESSION_ID}&lng=${params.lng}`,
      cancel_url: `${base}/api/stripe/return?status=cancelled&payment=${payment.id}&lng=${params.lng}`,
    });

    sessionId = session.id;

    await prisma.payment.update({
      where: { id: payment.id },
      data: { sessionId: session.id },
    });

    if (!session.url) throw new Error('Checkout session without url');

    return { url: session.url };
  } catch (error) {
    if (sessionId) {
      await getStripe()
        .checkout.sessions.expire(sessionId)
        .catch(() => undefined);
    }
    await releaseHold(prisma, payment.id);
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', cause: error });
  }
}
