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
