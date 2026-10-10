import 'server-only';

import type { LocalizedText } from '@/lib/i18n-content';

export function approvedMessage(name: LocalizedText): LocalizedText {
  return {
    el: `Το γήπεδό σου «${name.el}» εγκρίθηκε και είναι πλέον δημόσιο.`,
    en: `Your field "${name.en}" has been approved and is now public.`,
  };
}

export function rejectedMessage(
  name: LocalizedText,
  reason: LocalizedText | null,
): LocalizedText {
  const el = `Το γήπεδό σου «${name.el}» δεν εγκρίθηκε.`;
  const en = `Your field "${name.en}" wasn't approved.`;

  if (!reason) return { el, en };

  return {
    el: `${el} Λόγος: ${reason.el}`,
    en: `${en} Reason: ${reason.en}`,
  };
}
