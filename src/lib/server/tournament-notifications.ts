import 'server-only';

import type { LocalizedText } from '@/lib/i18n-content';

export function matchResultMessage(
  tournamentName: string,
  homeName: string,
  awayName: string,
  homeScore: number,
  awayScore: number,
): LocalizedText {
  const score = `${homeName} ${homeScore} - ${awayScore} ${awayName}`;
  return {
    el: `Νέο αποτέλεσμα στο τουρνουά «${tournamentName}»: ${score}.`,
    en: `New result in "${tournamentName}": ${score}.`,
  };
}

export function teamRequestReceivedMessage(
  teamName: string,
  tournamentName: string,
): LocalizedText {
  return {
    el: `Η ομάδα «${teamName}» ζήτησε να συμμετάσχει στο τουρνουά «${tournamentName}».`,
    en: `Team "${teamName}" requested to join "${tournamentName}".`,
  };
}

export function teamRequestAcceptedMessage(
  teamName: string,
  tournamentName: string,
): LocalizedText {
  return {
    el: `Η ομάδα «${teamName}» έγινε δεκτή στο τουρνουά «${tournamentName}».`,
    en: `Team "${teamName}" was accepted into "${tournamentName}".`,
  };
}

export function teamRequestRejectedMessage(
  teamName: string,
  tournamentName: string,
): LocalizedText {
  return {
    el: `Η αίτηση της ομάδας «${teamName}» για το τουρνουά «${tournamentName}» απορρίφθηκε.`,
    en: `The request of team "${teamName}" to join "${tournamentName}" was rejected.`,
  };
}
