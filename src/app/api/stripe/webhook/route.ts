import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import {
  confirmCheckoutSession,
  releaseHold,
} from '@/lib/server/booking-checkout';
import { getStripe, getWebhookSecret } from '@/lib/server/stripe';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      getWebhookSecret(),
    );
  } catch {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      await confirmCheckoutSession(prisma, event.data.object.id);
    }

    if (event.type === 'checkout.session.expired') {
      const paymentId = event.data.object.metadata?.paymentId;
      if (paymentId) await releaseHold(prisma, paymentId);
    }
  } catch (error) {
    console.error('[stripe webhook]', event.type, error);
    return NextResponse.json({ error: 'handler_failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
