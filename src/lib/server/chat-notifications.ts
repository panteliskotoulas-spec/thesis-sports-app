import 'server-only';

import type { LocalizedText } from '@/lib/i18n-content';

export function newChatMessageMessage(
  senderName: string,
  teamName: string | null,
): LocalizedText {
  if (teamName) {
    return {
      el: `Νέο μήνυμα από ${senderName} στην ομάδα ${teamName}.`,
      en: `New message from ${senderName} in ${teamName}.`,
    };
  }

  return {
    el: `Νέο μήνυμα από ${senderName}.`,
    en: `New message from ${senderName}.`,
  };
}
