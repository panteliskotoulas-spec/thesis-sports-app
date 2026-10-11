import 'server-only';

import { formatTimeRange } from '@/lib/fields/detail-format';
import type { LocalizedText } from '@/lib/i18n-content';

function describeSlot(
  startTime: Date,
  endTime: Date,
  lng: 'el' | 'en',
): string {
  const day = new Intl.DateTimeFormat(lng, {
    timeZone: 'Europe/Athens',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(startTime);

  return `${day}, ${formatTimeRange(startTime, endTime, lng)}`;
}

export type CancellationOutcome = 'card' | 'mixed' | 'credit';

const cancellationTails: Record<CancellationOutcome, LocalizedText> = {
  card: {
    el: 'Η επιστροφή θα εμφανιστεί στην κάρτα σου.',
    en: 'The refund will appear on your card.',
  },
  mixed: {
    el: 'Το ποσό επιστράφηκε στην κάρτα σου και στην πίστωσή σου.',
    en: 'The amount went back to your card and your credit.',
  },
  credit: {
    el: 'Το ποσό προστέθηκε στην πίστωσή σου.',
    en: 'The amount was added to your credit.',
  },
};

export function reservationCancelledMessage(
  fieldName: LocalizedText,
  startTime: Date,
  endTime: Date,
  outcome: CancellationOutcome,
): LocalizedText {
  const tail = cancellationTails[outcome];

  return {
    el: `Η κράτησή σου στο «${fieldName.el}» για ${describeSlot(startTime, endTime, 'el')} ακυρώθηκε. ${tail.el}`,
    en: `Your booking at "${fieldName.en}" for ${describeSlot(startTime, endTime, 'en')} was cancelled. ${tail.en}`,
  };
}

export function reservationCancelledByOwnerMessage(
  fieldName: LocalizedText,
  startTime: Date,
  endTime: Date,
  outcome: CancellationOutcome,
): LocalizedText {
  const tail = cancellationTails[outcome];

  return {
    el: `Ο ιδιοκτήτης ακύρωσε την κράτησή σου στο «${fieldName.el}» για ${describeSlot(startTime, endTime, 'el')}. ${tail.el}`,
    en: `The owner cancelled your booking at "${fieldName.en}" for ${describeSlot(startTime, endTime, 'en')}. ${tail.en}`,
  };
}

export function ownerBookingReceivedMessage(
  fieldName: LocalizedText,
  playerName: string,
  startTime: Date,
  endTime: Date,
): LocalizedText {
  return {
    el: `Νέα κράτηση στο «${fieldName.el}» για ${describeSlot(startTime, endTime, 'el')} (παίκτης: ${playerName}).`,
    en: `New booking at "${fieldName.en}" for ${describeSlot(startTime, endTime, 'en')} (player: ${playerName}).`,
  };
}

export function ownerBookingCancelledMessage(
  fieldName: LocalizedText,
  playerName: string,
  startTime: Date,
  endTime: Date,
): LocalizedText {
  return {
    el: `Ακυρώθηκε η κράτηση στο «${fieldName.el}» για ${describeSlot(startTime, endTime, 'el')} (παίκτης: ${playerName}).`,
    en: `A booking at "${fieldName.en}" for ${describeSlot(startTime, endTime, 'en')} was cancelled (player: ${playerName}).`,
  };
}

export function reservationConfirmedMessage(
  fieldName: LocalizedText,
  startTime: Date,
  endTime: Date,
): LocalizedText {
  return {
    el: `Η κράτησή σου στο «${fieldName.el}» για ${describeSlot(startTime, endTime, 'el')} επιβεβαιώθηκε.`,
    en: `Your booking at "${fieldName.en}" for ${describeSlot(startTime, endTime, 'en')} is confirmed.`,
  };
}

export function teamReservationCreatedMessage(
  teamName: string,
  fieldName: LocalizedText,
  bookerName: string,
  startTime: Date,
  endTime: Date,
): LocalizedText {
  return {
    el: `Νέα κράτηση για την ομάδα «${teamName}»: «${fieldName.el}», ${describeSlot(startTime, endTime, 'el')} (την έκλεισε ο αρχηγός ${bookerName}).`,
    en: `New booking for your team "${teamName}": "${fieldName.en}", ${describeSlot(startTime, endTime, 'en')} (booked by leader ${bookerName}).`,
  };
}

export function teamReservationCancelledMessage(
  teamName: string,
  fieldName: LocalizedText,
  startTime: Date,
  endTime: Date,
): LocalizedText {
  return {
    el: `Η κράτηση της ομάδας «${teamName}» στο «${fieldName.el}» για ${describeSlot(startTime, endTime, 'el')} ακυρώθηκε.`,
    en: `The booking for team "${teamName}" at "${fieldName.en}" for ${describeSlot(startTime, endTime, 'en')} was cancelled.`,
  };
}
