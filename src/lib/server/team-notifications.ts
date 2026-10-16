import 'server-only';

import type { LocalizedText } from '@/lib/i18n-content';

export function joinRequestReceivedMessage(
  userName: string,
  teamName: string,
): LocalizedText {
  return {
    el: `Ο χρήστης ${userName} θέλει να μπει στην ομάδα «${teamName}».`,
    en: `${userName} wants to join your team "${teamName}".`,
  };
}

export function joinRequestAcceptedMessage(teamName: string): LocalizedText {
  return {
    el: `Το αίτημά σου για την ομάδα «${teamName}» έγινε δεκτό. Καλώς ήρθες!`,
    en: `Your request to join "${teamName}" was accepted. Welcome!`,
  };
}

export function joinRequestRejectedMessage(teamName: string): LocalizedText {
  return {
    el: `Το αίτημά σου για την ομάδα «${teamName}» δεν έγινε δεκτό.`,
    en: `Your request to join "${teamName}" was not accepted.`,
  };
}

export function memberRemovedMessage(teamName: string): LocalizedText {
  return {
    el: `Αφαιρέθηκες από την ομάδα «${teamName}».`,
    en: `You were removed from the team "${teamName}".`,
  };
}

export function leadershipTransferredMessage(teamName: string): LocalizedText {
  return {
    el: `Είσαι πλέον αρχηγός της ομάδας «${teamName}».`,
    en: `You are now the leader of "${teamName}".`,
  };
}
