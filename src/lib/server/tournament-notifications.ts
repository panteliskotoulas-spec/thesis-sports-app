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
