import {
  canCancelBooking,
  formatAmount,
  type CompensationValue,
} from '@/lib/bookings/booking';
import { formatDayChip, formatTimeRange } from '@/lib/fields/detail-format';
import { todayInAthens } from '@/lib/fields/filters';
import type { SportType } from '@/lib/fields/types';
import type { SessionReview } from '@/lib/reviews/review';

export const SESSION_PAYMENT_WINDOW_HOURS = 24;

export type CoachSessionState =
  | 'REQUESTED'
  | 'AWAITING_PAYMENT'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export type CoachRequestState = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type CoachRequestPayment = 'PAID' | 'AWAITING' | 'EXPIRED';

export type RequestSessionResult = 'ok' | 'conflict' | 'unauthorized' | 'error';

export type RespondRequestResult =
  | { status: 'ok'; payBy: Date | null }
  | { status: 'conflict' }
  | { status: 'error' };

export type PaySessionResult =
  | { status: 'redirect'; url: string }
  | { status: 'ok' }
  | { status: 'conflict' }
  | { status: 'error' };

export type CancelCoachRequestResult =
  | { status: 'ok' }
  | { status: 'conflict' }
  | { status: 'error' };

export type CancelSessionResult =
  | { status: 'ok' }
  | { status: 'tooLate' }
  | { status: 'conflict' }
  | { status: 'error' };

export interface RequestSessionInput {
  slotId: string;
  teamId: string | null;
  lng: string;
}

export interface CancelSessionInput {
  sessionId: string;
  compensation: CompensationValue | null;
}

export interface CoachSessionRow {
  id: string;
  coachId: string;
  coachName: string;
  sportType: SportType;
  startTime: Date;
  endTime: Date;
  price: number;
  credit: number;
  state: CoachSessionState;
  payBy: Date | null;
  wasPaid: boolean;
  compensation: CompensationValue | null;
  teamName: string | null;
  cancelledByCoach: boolean;
  review?: SessionReview | null;
}

export interface CoachSessionItem {
  id: string;
  coachId: string;
  coachName: string;
  coachHref: string;
  sport: string;
  date: string;
  time: string;
  state: CoachSessionState;
  price: number;
  creditValue: number;
  total: string;
  card: string | null;
  credit: string | null;
  payBy: string | null;
  wasPaid: boolean;
  compensation: CompensationValue | null;
  canCancel: boolean;
  reviewable: boolean;
  review: SessionReview | null;
  teamName: string | null;
  cancelledByCoach: boolean;
}

export interface CoachRequestRow {
  id: string;
  requesterName: string;
  teamName: string | null;
  startTime: Date;
  endTime: Date;
  price: number;
  state: CoachRequestState;
  payment: CoachRequestPayment | null;
  payBy: Date | null;
  credit: number;
}

export interface CoachRequestItem {
  id: string;
  requesterName: string;
  initial: string;
  teamName: string | null;
  date: string;
  time: string;
  price: string;
  state: CoachRequestState;
  payment: CoachRequestPayment | null;
  payBy: string | null;
  canCancel: boolean;
  card: string | null;
  credit: string | null;
}

export interface CoachRequestSlotItem {
  id: string;
  time: string;
  price: string;
}

export function formatDeadline(date: Date, lng: string): string {
  return new Intl.DateTimeFormat(lng, {
    timeZone: 'Europe/Athens',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

export function paymentDeadline(
  acceptedAt: Date,
  startTime: Date,
  windowHours: number = SESSION_PAYMENT_WINDOW_HOURS,
): Date {
  const byWindow = acceptedAt.getTime() + windowHours * 3_600_000;
  return new Date(Math.min(byWindow, startTime.getTime()));
}

export function toCoachSessionItem(
  row: CoachSessionRow,
  lng: string,
  sportLabel: string,
  now: Date = new Date(),
): CoachSessionItem {
  const card = Math.max(0, Math.round((row.price - row.credit) * 100) / 100);

  return {
    id: row.id,
    coachId: row.coachId,
    coachName: row.coachName,
    coachHref: `/${lng}/coaches/${row.coachId}`,
    sport: sportLabel,
    date: formatDayChip(todayInAthens(row.startTime), lng).full,
    time: formatTimeRange(row.startTime, row.endTime, lng),
    state: row.state,
    price: row.price,
    creditValue: row.credit,
    total: formatAmount(row.price, lng),
    card: card > 0 ? formatAmount(card, lng) : null,
    credit: row.credit > 0 ? formatAmount(row.credit, lng) : null,
    payBy: row.payBy ? formatDeadline(row.payBy, lng) : null,
    wasPaid: row.wasPaid,
    compensation: row.compensation,
    canCancel:
      row.state === 'CONFIRMED' &&
      row.startTime > now &&
      canCancelBooking(row.startTime, now),
    reviewable: row.state === 'CONFIRMED' && row.endTime <= now,
    review: row.review ?? null,
    teamName: row.teamName,
    cancelledByCoach: row.cancelledByCoach,
  };
}

export function toCoachRequestItem(
  row: CoachRequestRow,
  lng: string,
  now: Date = new Date(),
): CoachRequestItem {
  const credit = row.credit;
  const card = Math.max(0, Math.round((row.price - credit) * 100) / 100);

  return {
    id: row.id,
    requesterName: row.requesterName,
    initial: row.requesterName.trim().charAt(0).toUpperCase(),
    teamName: row.teamName,
    date: formatDayChip(todayInAthens(row.startTime), lng).full,
    time: formatTimeRange(row.startTime, row.endTime, lng),
    price: formatAmount(row.price, lng),
    state: row.state,
    payment: row.payment,
    payBy: row.payBy ? formatDeadline(row.payBy, lng) : null,
    canCancel:
      row.state === 'ACCEPTED' && row.payment === 'PAID' && row.endTime > now,
    card: card > 0 ? formatAmount(card, lng) : null,
    credit: credit > 0 ? formatAmount(credit, lng) : null,
  };
}
