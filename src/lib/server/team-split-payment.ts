import 'server-only';

import { TRPCError } from '@trpc/server';
import type Stripe from 'stripe';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import { computePaymentSplit } from '@/lib/bookings/payment-split';
import { formatDayChip, formatTimeRange } from '@/lib/fields/detail-format';
import { todayInAthens } from '@/lib/fields/filters';
import { localized, type LocalizedText } from '@/lib/i18n-content';
import {
  AlreadyHandled,
  asLocalized,
  BookingAbort,
  CHECKOUT_EXPIRES_MINUTES,
  decimalToCents,
  money,
} from '@/lib/server/booking-shared';
import { releaseHold } from '@/lib/server/booking-checkout';
import { teamSplitPaidMessage } from '@/lib/server/booking-notifications';
import { getAppUrl, getStripe } from '@/lib/server/stripe';

export interface StartSplitCheckoutParams {
  userId: string;
  userEmail: string;
  reservationId: string;
  useCredit: boolean;
  lng: 'el' | 'en';
}

export type SplitConfirmResult =
  | { status: 'confirmed' }
  | { status: 'pending' }
  | { status: 'refunded' }
  | { status: 'invalid' };

const reservationSelect = {
  id: true,
  userId: true,
  teamId: true,
  status: true,
  team: { select: { name: true } },
  slot: {
    select: {
      startTime: true,
      endTime: true,
      field: { select: { name: true } },
    },
  },
} satisfies Prisma.ReservationSelect;

function paymentIntentId(session: Stripe.Checkout.Session): string | null {
  const intent = session.payment_intent;
  if (typeof intent === 'string') return intent;
  return intent?.id ?? null;
}

async function refundCardPayment(
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

interface FinalizeParams {
  splitId: string;
  reservationId: string;
  teamId: string;
  userId: string;
  payerId: string;
  memberName: string;
  shareCents: number;
  creditCents: number;
  fieldName: LocalizedText;
  startTime: Date;
  endTime: Date;
}

async function finalizeSplitPaid(
  tx: Prisma.TransactionClient,
  params: FinalizeParams,
): Promise<void> {
  const locked = await tx.reservation.updateMany({
    where: { id: params.reservationId, status: 'CONFIRMED' },
    data: { status: 'CONFIRMED' },
  });
  if (locked.count === 0) throw new BookingAbort('slot_lost');

  const claimed = await tx.paymentSplit.updateMany({
    where: { id: params.splitId, status: 'PENDING' },
    data: { status: 'PAID', paidAt: new Date() },
  });
  if (claimed.count === 0) throw new BookingAbort('slot_lost');

  if (params.creditCents > 0) {
    const charged = await tx.user.updateMany({
      where: {
        id: params.userId,
        creditBalance: { gte: money(params.creditCents) },
      },
      data: { creditBalance: { decrement: money(params.creditCents) } },
    });
    if (charged.count === 0) throw new BookingAbort('credit_short');

    await tx.creditTransaction.create({
      data: {
        userId: params.userId,
        amount: money(-params.creditCents),
        type: 'SPENT_ON_SPLIT',
        relatedReservationId: params.reservationId,
      },
    });
  }

  await tx.user.update({
    where: { id: params.payerId },
    data: { creditBalance: { increment: money(params.shareCents) } },
  });

  await tx.creditTransaction.create({
    data: {
      userId: params.payerId,
      amount: money(params.shareCents),
      type: 'EARNED_FROM_SPLIT',
      relatedReservationId: params.reservationId,
    },
  });

  await tx.notification.create({
    data: {
      userId: params.payerId,
      type: 'TEAM_SPLIT_PAID',
      message: teamSplitPaidMessage(
        params.memberName,
        params.shareCents,
        params.fieldName,
        params.startTime,
        params.endTime,
      ),
      linkUrl: `/teams/${params.teamId}`,
    },
  });
}

export async function confirmSplitCheckoutSession(
  prisma: PrismaClient,
  sessionId: string,
): Promise<SplitConfirmResult> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);

  const paymentId = session.metadata?.paymentId;
  const splitId = session.metadata?.splitId;
  if (!paymentId || !splitId) return { status: 'invalid' };

  if (session.payment_status !== 'paid') {
    return { status: session.status === 'expired' ? 'invalid' : 'pending' };
  }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

  if (!payment || !payment.userId || payment.splitId !== splitId) {
    return { status: 'invalid' };
  }
  if (payment.sessionId !== session.id) return { status: 'invalid' };
  if (session.metadata?.userId !== payment.userId) return { status: 'invalid' };

  const creditCents = decimalToCents(payment.creditApplied);
  const shareCents = decimalToCents(payment.amount);
  const cardCents = shareCents - creditCents;
  if (session.amount_total !== cardCents) return { status: 'invalid' };

  if (payment.status === 'SUCCEEDED') return { status: 'confirmed' };
  if (payment.status === 'REFUNDED') return { status: 'refunded' };

  if (payment.status === 'FAILED') {
    await refundCardPayment(session, payment.id);
    return { status: 'refunded' };
  }

  const split = await prisma.paymentSplit.findUnique({
    where: { id: splitId },
    select: { id: true, reservationId: true, userId: true },
  });

  const reservation = split
    ? await prisma.reservation.findUnique({
        where: { id: split.reservationId },
        select: reservationSelect,
      })
    : null;

  if (
    !split ||
    split.userId !== payment.userId ||
    !reservation ||
    !reservation.teamId
  ) {
    await refundCardPayment(session, payment.id);
    await prisma.payment.updateMany({
      where: { id: payment.id, status: 'PENDING' },
      data: { status: 'FAILED' },
    });
    return { status: 'refunded' };
  }

  const teamId = reservation.teamId;
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

      const member = await tx.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      await finalizeSplitPaid(tx, {
        splitId: split.id,
        reservationId: reservation.id,
        teamId,
        userId,
        payerId: reservation.userId,
        memberName: member?.name ?? '',
        shareCents,
        creditCents,
        fieldName: asLocalized(reservation.slot.field.name),
        startTime: reservation.slot.startTime,
        endTime: reservation.slot.endTime,
      });
    });

    return { status: 'confirmed' };
  } catch (error) {
    if (error instanceof AlreadyHandled) {
      return confirmSplitCheckoutSession(prisma, sessionId);
    }

    if (error instanceof BookingAbort) {
      await refundCardPayment(session, payment.id);
      await releaseHold(prisma, payment.id);
      return { status: 'refunded' };
    }

    throw error;
  }
}

export async function abandonSplitPayment(
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
        const result = await confirmSplitCheckoutSession(
          prisma,
          payment.sessionId,
        );
        return result.status === 'confirmed' ? 'confirmed' : 'released';
      }
    }
  }

  await releaseHold(prisma, payment.id);
  return 'released';
}

export async function startSplitCheckout(
  prisma: PrismaClient,
  params: StartSplitCheckoutParams,
): Promise<{ url: string | null }> {
  const now = new Date();

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.reservationId },
    select: reservationSelect,
  });

  if (
    !reservation ||
    !reservation.teamId ||
    !reservation.team ||
    reservation.status !== 'CONFIRMED' ||
    reservation.slot.endTime <= now
  ) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  const split = await prisma.paymentSplit.findUnique({
    where: {
      reservationId_userId: {
        reservationId: reservation.id,
        userId: params.userId,
      },
    },
    select: { id: true, amount: true, status: true },
  });

  if (!split) throw new TRPCError({ code: 'NOT_FOUND' });
  if (split.status !== 'PENDING') throw new TRPCError({ code: 'CONFLICT' });

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { creditBalance: true, name: true },
  });
  if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });

  const teamId = reservation.teamId;
  const fieldName = asLocalized(reservation.slot.field.name);
  const shareCents = decimalToCents(split.amount);
  const payment = computePaymentSplit(
    shareCents,
    decimalToCents(user.creditBalance),
    params.useCredit,
  );

  if (!payment.valid) throw new TRPCError({ code: 'BAD_REQUEST' });

  const previous = await prisma.payment.findMany({
    where: { userId: params.userId, splitId: split.id, status: 'PENDING' },
    select: { id: true, sessionId: true },
  });

  for (const item of previous) {
    const outcome = await abandonSplitPayment(prisma, item);
    if (outcome === 'confirmed') return { url: null };
  }

  if (payment.cardCents === 0) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.payment.create({
          data: {
            userId: params.userId,
            splitId: split.id,
            teamId,
            amount: money(shareCents),
            platformFee: 0,
            ownerPayout: 0,
            method: 'CREDIT',
            creditApplied: money(payment.creditCents),
            status: 'SUCCEEDED',
          },
        });

        await finalizeSplitPaid(tx, {
          splitId: split.id,
          reservationId: reservation.id,
          teamId,
          userId: params.userId,
          payerId: reservation.userId,
          memberName: user.name,
          shareCents,
          creditCents: payment.creditCents,
          fieldName,
          startTime: reservation.slot.startTime,
          endTime: reservation.slot.endTime,
        });
      });
    } catch (error) {
      if (error instanceof BookingAbort) {
        throw new TRPCError({
          code: error.reason === 'credit_short' ? 'BAD_REQUEST' : 'CONFLICT',
        });
      }
      throw error;
    }

    return { url: null };
  }

  const created = await prisma.payment.create({
    data: {
      userId: params.userId,
      splitId: split.id,
      teamId,
      amount: money(shareCents),
      platformFee: 0,
      ownerPayout: 0,
      method: payment.method,
      creditApplied: money(payment.creditCents),
      status: 'PENDING',
    },
    select: { id: true },
  });

  const day = todayInAthens(reservation.slot.startTime);
  const description = `${formatDayChip(day, params.lng).full}, ${formatTimeRange(reservation.slot.startTime, reservation.slot.endTime, params.lng)}`;
  const productName = `${localized(fieldName, params.lng)} (${reservation.team.name})`;
  const base = getAppUrl();

  let sessionId: string | null = null;

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      locale: params.lng,
      customer_email: params.userEmail,
      client_reference_id: created.id,
      expires_at: Math.floor(
        (Date.now() + CHECKOUT_EXPIRES_MINUTES * 60_000) / 1000,
      ),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: payment.cardCents,
            product_data: { name: productName, description },
          },
        },
      ],
      metadata: {
        paymentId: created.id,
        splitId: split.id,
        userId: params.userId,
        teamId,
      },
      success_url: `${base}/api/stripe/return?status=success&kind=split&team=${teamId}&session_id={CHECKOUT_SESSION_ID}&lng=${params.lng}`,
      cancel_url: `${base}/api/stripe/return?status=cancelled&kind=split&team=${teamId}&payment=${created.id}&lng=${params.lng}`,
    });

    sessionId = session.id;

    await prisma.payment.update({
      where: { id: created.id },
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
    await releaseHold(prisma, created.id);
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', cause: error });
  }
}
