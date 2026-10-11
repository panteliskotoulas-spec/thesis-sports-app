import 'server-only';

import type { LocalizedText } from '@/lib/i18n-content';

export function coachApprovedMessage(): LocalizedText {
  return {
    el: 'Το προφίλ προπονητή σου εγκρίθηκε.',
    en: 'Your coach profile has been approved.',
  };
}

export function coachRejectedMessage(
  reason: LocalizedText | null,
): LocalizedText {
  const el = 'Το προφίλ προπονητή σου δεν εγκρίθηκε.';
  const en = "Your coach profile wasn't approved.";

  if (!reason) return { el, en };

  return {
    el: `${el} Λόγος: ${reason.el}`,
    en: `${en} Reason: ${reason.en}`,
  };
}
