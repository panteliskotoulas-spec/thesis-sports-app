export const HOLD_MINUTES = 30;
export const CANCEL_WINDOW_HOURS = 24;

export type CompensationValue = 'REFUND' | 'CREDIT';
export type ReservationStatusValue = 'CONFIRMED' | 'CANCELLED';
export type BookingPhase = 'upcoming' | 'past';

export interface BookingItem {
  id: string;
  fieldName: string;
  fieldHref: string;
  sport: string;
  date: string;
  time: string;
  status: ReservationStatusValue;
  phase: BookingPhase;
  canCancel: boolean;
  total: string;
  card: string | null;
  credit: string | null;
  compensation: CompensationValue | null;
}

export interface StartCheckoutInput {
  slotId: string;
  useCredit: boolean;
  lng: string;
}

export type StartCheckoutResult =
  | { status: 'redirect'; url: string }
  | { status: 'confirmed' }
  | { status: 'conflict' }
  | { status: 'unauthorized' }
  | { status: 'invalid' }
  | { status: 'error' };

export interface CancelBookingInput {
  reservationId: string;
  compensation: CompensationValue;
}

export type CancelBookingResult =
  | { status: 'ok' }
  | { status: 'tooLate' }
  | { status: 'conflict' }
  | { status: 'error' };

export function canCancelBooking(
  startTime: Date,
  now: Date = new Date(),
): boolean {
  const windowMs = CANCEL_WINDOW_HOURS * 60 * 60 * 1000;
  return startTime.getTime() - now.getTime() >= windowMs;
}

export function formatAmount(value: number, lng: string): string {
  return new Intl.NumberFormat(lng, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function fillTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key] : match,
  );
}
