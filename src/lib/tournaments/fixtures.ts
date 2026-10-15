export interface Fixture {
  round: number;
  homeTeamId: string;
  awayTeamId: string;
}

export type Legs = 1 | 2;

export function generateRoundRobin(
  teamIds: readonly string[],
  legs: Legs,
): Fixture[] {
  if (teamIds.length < 2) return [];

  let slots: (string | null)[] = [...teamIds];
  if (slots.length % 2 === 1) slots = [...slots, null];

  const size = slots.length;
  const roundsPerLeg = size - 1;
  const firstLeg: Fixture[] = [];

  for (let round = 0; round < roundsPerLeg; round += 1) {
    for (let index = 0; index < size / 2; index += 1) {
      const first = slots[index];
      const second = slots[size - 1 - index];
      if (first === null || second === null) continue;

      const flip = (round + index) % 2 === 1;
      firstLeg.push({
        round: round + 1,
        homeTeamId: flip ? second : first,
        awayTeamId: flip ? first : second,
      });
    }

    slots = [slots[0], slots[size - 1], ...slots.slice(1, size - 1)];
  }

  if (legs === 1) return firstLeg;

  const secondLeg = firstLeg.map((fixture) => ({
    round: fixture.round + roundsPerLeg,
    homeTeamId: fixture.awayTeamId,
    awayTeamId: fixture.homeTeamId,
  }));

  return [...firstLeg, ...secondLeg];
}
