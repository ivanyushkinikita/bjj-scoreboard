import type { TournamentMatch, TournamentState } from "../../types/tournament";

export type Athlete = { id: number; name: string; duplicateIndex?: number };
export type RoundRobinStanding = {
  athleteId: number;
  played: number;
  wins: number;
  losses: number;
};
export const pairKey = (athleteA: number | null, athleteB: number | null) =>
  athleteA === null || athleteB === null
    ? ""
    : [athleteA, athleteB].sort((left, right) => left - right).join(":");

function balancedFirstRoundSeeds(seeds: (number | null)[]) {
  const athletes = seeds.filter((id): id is number => id !== null);
  const bracketSize = 2 ** Math.ceil(Math.log2(Math.max(2, athletes.length)));
  const firstRoundMatches = bracketSize / 2;
  const extraAthletes = athletes.length - firstRoundMatches;
  let cursor = 0;

  // Spread byes across round one. This prevents a competitor from being
  // advanced through an empty second-round branch straight into the final.
  return Array.from({ length: firstRoundMatches }, (_, index) => {
    const pair: (number | null)[] = [athletes[cursor++] ?? null];
    pair.push(index < extraAthletes ? (athletes[cursor++] ?? null) : null);
    return pair;
  }).flat();
}

export function tournamentRounds(
  tournament: TournamentState,
): TournamentMatch[][] {
  const rounds: TournamentMatch[][] = [];
  let entrants: { id: number | null; resolved: boolean }[] =
    balancedFirstRoundSeeds(tournament.seeds).map((id) => ({
      id,
      resolved: true,
    }));
  let round = 0;
  while (entrants.length > 1) {
    const resolvedMatches = Array.from(
      { length: entrants.length / 2 },
      (_, index) => {
        const sourceA = entrants[index * 2];
        const sourceB = entrants[index * 2 + 1];
        const athleteA = sourceA.id;
        const athleteB = sourceB.id;
        const id = `round-${round}-match-${index}`;
        const selectedWinner = tournament.results[id];
        const canResolve = sourceA.resolved && sourceB.resolved;
        const playable = canResolve && athleteA !== null && athleteB !== null;
        const winnerId = !canResolve
          ? null
          : playable
            ? selectedWinner === athleteA || selectedWinner === athleteB
              ? selectedWinner
              : null
            : (athleteA ?? athleteB);
        const resolved = canResolve && (!playable || winnerId !== null);
        return {
          match: {
            id,
            round,
            index,
            athleteA,
            athleteB,
            winnerId,
            automatic: canResolve && !playable && winnerId !== null,
          },
          entrant: { id: winnerId, resolved },
        };
      },
    );
    const matches = resolvedMatches.map((item) => item.match);
    rounds.push(matches);
    entrants = resolvedMatches.map((item) => item.entrant);
    round += 1;
  }
  return rounds;
}

export function roundRobinRounds(
  tournament: TournamentState,
): TournamentMatch[][] {
  const athletes = Array.from(
    new Set(tournament.seeds.filter((id): id is number => id !== null)),
  );
  if (athletes.length < 2) return [];
  const rotation: (number | null)[] =
    athletes.length % 2 === 0 ? [...athletes] : [...athletes, null];
  const rounds: TournamentMatch[][] = [];
  for (let round = 0; round < rotation.length - 1; round += 1) {
    const matches = Array.from({ length: rotation.length / 2 }, (_, index) => {
      const athleteA = rotation[index];
      const athleteB = rotation[rotation.length - 1 - index];
      const id = `round-robin-${round}-match-${index}`;
      const selectedWinner = tournament.results[id];
      return {
        id,
        round,
        index,
        athleteA,
        athleteB,
        winnerId:
          selectedWinner === athleteA || selectedWinner === athleteB
            ? selectedWinner
            : null,
        automatic: false,
      };
    }).filter((match) => match.athleteA !== null && match.athleteB !== null);
    rounds.push(matches);
    rotation.splice(1, 0, rotation.pop()!);
  }
  return rounds;
}

export function roundRobinStandings(
  tournament: TournamentState,
  rounds = roundRobinRounds(tournament),
): RoundRobinStanding[] {
  const standings = new Map<number, RoundRobinStanding>();
  for (const athleteId of new Set(
    tournament.seeds.filter((id): id is number => id !== null),
  ))
    standings.set(athleteId, { athleteId, played: 0, wins: 0, losses: 0 });
  for (const match of rounds.flat()) {
    if (
      match.winnerId === null ||
      match.athleteA === null ||
      match.athleteB === null
    )
      continue;
    const winner = standings.get(match.winnerId)!;
    const loser = standings.get(
      match.winnerId === match.athleteA ? match.athleteB : match.athleteA,
    )!;
    winner.played += 1;
    winner.wins += 1;
    loser.played += 1;
    loser.losses += 1;
  }
  return [...standings.values()].sort(
    (left, right) =>
      right.wins - left.wins ||
      right.played - left.played ||
      left.athleteId - right.athleteId,
  );
}
