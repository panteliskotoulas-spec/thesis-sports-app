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
