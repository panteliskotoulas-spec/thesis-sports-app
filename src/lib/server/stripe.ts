import 'server-only';

import Stripe from 'stripe';

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not set');

  client = new Stripe(secretKey);
  return client;
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  return secret;
}

export function getAppUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? 'http://localhost:3000';
  return url.replace(/\/+$/, '');
}
