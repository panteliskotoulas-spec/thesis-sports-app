import 'server-only';

import type { Prisma } from '@/generated/prisma/client';
import type { LocalizedText } from '@/lib/i18n-content';

export const CHECKOUT_EXPIRES_MINUTES = 31;
export const SLOT_HOLD_MINUTES = 32;

export function money(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function decimalToCents(value: { toNumber(): number }): number {
  return Math.round(value.toNumber() * 100);
}

export function asLocalized(value: unknown): LocalizedText {
  const record = (value ?? {}) as Partial<LocalizedText>;
  return { el: record.el ?? '', en: record.en ?? '' };
}

export function availableSlotWhere(
  now: Date,
): Prisma.AvailabilitySlotWhereInput {
  return {
    startTime: { gt: now },
    OR: [
      { status: 'OPEN' },
      { status: 'PENDING_PAYMENT', holdExpiresAt: { lt: now } },
    ],
  };
}

export class BookingAbort extends Error {
  constructor(readonly reason: 'slot_lost' | 'credit_short') {
    super(reason);
  }
}

export class AlreadyHandled extends Error {
  constructor() {
    super('already_handled');
  }
}
