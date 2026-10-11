import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  abandonPayment,
  confirmCheckoutSession,
} from '@/lib/server/booking-checkout';
import {
  abandonSplitPayment,
  confirmSplitCheckoutSession,
} from '@/lib/server/team-split-payment';

export const runtime = 'nodejs';

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

function safeId(value: string | null): string | null {
  return value && /^[A-Za-z0-9_-]+$/.test(value) ? value : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lng = url.searchParams.get('lng') === 'en' ? 'en' : 'el';
  const status = url.searchParams.get('status');
  const isSplit = url.searchParams.get('kind') === 'split';
  const teamId = safeId(url.searchParams.get('team'));
  const teamPath = teamId ? `/${lng}/teams/${teamId}` : `/${lng}/teams`;

  if (status === 'success') {
    const sessionId = url.searchParams.get('session_id');
    if (!sessionId) return redirectTo(request, `/${lng}/bookings`);

    if (isSplit) {
      try {
        const result = await confirmSplitCheckoutSession(prisma, sessionId);

        if (result.status === 'confirmed') {
          return redirectTo(request, `${teamPath}?split=paid`);
        }
        if (result.status === 'pending') return redirectTo(request, teamPath);
        return redirectTo(request, `${teamPath}?split=failed`);
      } catch (error) {
        console.error('[stripe return]', error);
        return redirectTo(request, teamPath);
      }
    }

    try {
      const result = await confirmCheckoutSession(prisma, sessionId);

      if (result.status === 'confirmed') {
        return redirectTo(request, `/${lng}/bookings?booked=1`);
      }
      if (result.status === 'pending') {
        return redirectTo(request, `/${lng}/bookings`);
      }
      return redirectTo(request, `/${lng}/bookings?payment=failed`);
    } catch (error) {
      console.error('[stripe return]', error);
      return redirectTo(request, `/${lng}/bookings`);
    }
  }

  if (status === 'cancelled' && isSplit) {
    const paymentId = safeId(url.searchParams.get('payment'));

    if (paymentId) {
      try {
        const session = await auth.api.getSession({
          headers: request.headers,
        });

        const payment = await prisma.payment.findUnique({
          where: { id: paymentId },
          select: { id: true, userId: true, sessionId: true },
        });

        if (session && payment && payment.userId === session.user.id) {
          const outcome = await abandonSplitPayment(prisma, payment);

          if (outcome === 'confirmed') {
            return redirectTo(request, `${teamPath}?split=paid`);
          }
        }
      } catch (error) {
        console.error('[stripe return]', error);
      }
    }

    return redirectTo(request, teamPath);
  }

  if (status === 'cancelled') {
    const paymentId = url.searchParams.get('payment');
    let target = `/${lng}/fields`;

    if (paymentId) {
      try {
        const session = await auth.api.getSession({
          headers: request.headers,
        });

        const payment = await prisma.payment.findUnique({
          where: { id: paymentId },
          select: { id: true, userId: true, sessionId: true, slotId: true },
        });

        if (session && payment && payment.userId === session.user.id) {
          const outcome = await abandonPayment(prisma, payment);

          if (outcome === 'confirmed') {
            return redirectTo(request, `/${lng}/bookings?booked=1`);
          }

          if (payment.slotId) {
            const slot = await prisma.availabilitySlot.findUnique({
              where: { id: payment.slotId },
              select: { fieldId: true },
            });
            if (slot) target = `/${lng}/fields/${slot.fieldId}`;
          }
        }
      } catch (error) {
        console.error('[stripe return]', error);
      }
    }

    return redirectTo(request, target);
  }

  return redirectTo(request, `/${lng}/bookings`);
}
