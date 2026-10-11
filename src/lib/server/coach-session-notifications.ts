import 'server-only';

import { formatTimeRange } from '@/lib/fields/detail-format';
import type { LocalizedText } from '@/lib/i18n-content';
import { formatDeadline } from '@/lib/coaches/coach-session';

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

function when(startTime: Date, endTime: Date): LocalizedText {
  return {
    el: describeSlot(startTime, endTime, 'el'),
    en: describeSlot(startTime, endTime, 'en'),
  };
}

export function sessionRequestedMessage(
  requesterName: string,
  teamName: string | null,
  startTime: Date,
  endTime: Date,
): LocalizedText {
  const slot = when(startTime, endTime);
  const el = teamName ? `${requesterName} (${teamName})` : requesterName;

  return {
    el: `Νέο αίτημα συνεδρίας από ${el} για ${slot.el}.`,
    en: `New session request from ${el} for ${slot.en}.`,
  };
}

export function sessionAcceptedMessage(
  coachName: string,
  startTime: Date,
  endTime: Date,
  payBy: Date,
): LocalizedText {
  const slot = when(startTime, endTime);

  return {
    el: `Ο προπονητής ${coachName} αποδέχτηκε το αίτημά σου για ${slot.el}. Πλήρωσε έως ${formatDeadline(payBy, 'el')}.`,
    en: `Coach ${coachName} accepted your request for ${slot.en}. Pay by ${formatDeadline(payBy, 'en')}.`,
  };
}

export function sessionRejectedMessage(
  coachName: string,
  startTime: Date,
  endTime: Date,
): LocalizedText {
  const slot = when(startTime, endTime);

  return {
    el: `Ο προπονητής ${coachName} απέρριψε το αίτημά σου για ${slot.el}.`,
    en: `Coach ${coachName} declined your request for ${slot.en}.`,
  };
}

export function sessionPaidMessage(
  coachName: string,
  startTime: Date,
  endTime: Date,
): LocalizedText {
  const slot = when(startTime, endTime);

  return {
    el: `Η συνεδρία σου με τον προπονητή ${coachName} για ${slot.el} επιβεβαιώθηκε.`,
    en: `Your session with coach ${coachName} for ${slot.en} is confirmed.`,
  };
}

export function sessionPaidCoachMessage(
  playerName: string,
  startTime: Date,
  endTime: Date,
): LocalizedText {
  const slot = when(startTime, endTime);

  return {
    el: `Ο/Η ${playerName} πλήρωσε τη συνεδρία για ${slot.el}.`,
    en: `${playerName} paid for the session on ${slot.en}.`,
  };
}

export function sessionExpiredMessage(
  coachName: string,
  startTime: Date,
  endTime: Date,
): LocalizedText {
  const slot = when(startTime, endTime);

  return {
    el: `Το αίτημά σου προς τον προπονητή ${coachName} για ${slot.el} έληξε, επειδή δεν ολοκληρώθηκε η πληρωμή.`,
    en: `Your request to coach ${coachName} for ${slot.en} expired because the payment wasn't completed.`,
  };
}

export function sessionExpiredCoachMessage(
  playerName: string,
  startTime: Date,
  endTime: Date,
): LocalizedText {
  const slot = when(startTime, endTime);

  return {
    el: `Η συνεδρία με ${playerName} για ${slot.el} έληξε χωρίς πληρωμή. Η ώρα είναι ξανά ελεύθερη.`,
    en: `The session with ${playerName} for ${slot.en} expired unpaid. The slot is open again.`,
  };
}

export type SessionCancellationOutcome = 'card' | 'mixed' | 'credit' | 'none';

const tails: Record<SessionCancellationOutcome, LocalizedText> = {
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
  none: { el: '', en: '' },
};

export function sessionCancelledMessage(
  coachName: string,
  startTime: Date,
  endTime: Date,
  outcome: SessionCancellationOutcome,
): LocalizedText {
  const slot = when(startTime, endTime);
  const tail = tails[outcome];

  return {
    el: `Η συνεδρία σου με τον προπονητή ${coachName} για ${slot.el} ακυρώθηκε. ${tail.el}`.trim(),
    en: `Your session with coach ${coachName} for ${slot.en} was cancelled. ${tail.en}`.trim(),
  };
}

export function sessionCancelledCoachMessage(
  playerName: string,
  startTime: Date,
  endTime: Date,
): LocalizedText {
  const slot = when(startTime, endTime);

  return {
    el: `Ο/Η ${playerName} ακύρωσε τη συνεδρία για ${slot.el}. Η ώρα είναι ξανά ελεύθερη.`,
    en: `${playerName} cancelled the session on ${slot.en}. The slot is open again.`,
  };
}

export function sessionCancelledByCoachMessage(
  coachName: string,
  startTime: Date,
  endTime: Date,
  outcome: SessionCancellationOutcome,
): LocalizedText {
  const slot = when(startTime, endTime);
  const tail = tails[outcome];

  return {
    el: `Ο προπονητής ${coachName} ακύρωσε τη συνεδρία σου για ${slot.el}. ${tail.el}`.trim(),
    en: `Coach ${coachName} cancelled your session for ${slot.en}. ${tail.en}`.trim(),
  };
}

export function sessionCancelledByCoachTeamMessage(
  coachName: string,
  teamName: string,
  startTime: Date,
  endTime: Date,
): LocalizedText {
  const slot = when(startTime, endTime);

  return {
    el: `Ο προπονητής ${coachName} ακύρωσε τη συνεδρία της ομάδας ${teamName} για ${slot.el}.`,
    en: `Coach ${coachName} cancelled the session of ${teamName} for ${slot.en}.`,
  };
}
