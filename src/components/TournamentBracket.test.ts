import { expect, it } from 'vitest';
import { tournamentRounds } from './TournamentBracket';
import type { TournamentState } from '../types/tournament';

const tournament = (results: Record<string, number> = {}): TournamentState => ({
  draft: { name: 'Open', matchDuration: 300000, competitors: ['A', 'B', 'C', ''], matchColors: ['red', 'blue'], format: 'single-elimination', ruleset: 'standard' },
  seeds: [0, 1, 2, null],
  results,
});

it('automatically advances a lone athlete but waits for the adjacent match winner', () => {
  const initial = tournamentRounds(tournament());
  expect(initial[0][1]).toMatchObject({ winnerId: 2, automatic: true });
  expect(initial[1][0]).toMatchObject({ athleteA: null, athleteB: 2, winnerId: null, automatic: false });

  const afterFirstMatch = tournamentRounds(tournament({ 'round-0-match-0': 0 }));
  expect(afterFirstMatch[1][0]).toMatchObject({ athleteA: 0, athleteB: 2, winnerId: null });

  const complete = tournamentRounds(tournament({ 'round-0-match-0': 0, 'round-1-match-0': 0 }));
  expect(complete[1][0].winnerId).toBe(0);
});

it('spreads first-round byes so no athlete skips straight to the final', () => {
  const rounds = tournamentRounds({ ...tournament(), seeds: [0, 1, 2, 3, 4] });

  expect(rounds[0].filter(match => match.automatic)).toHaveLength(3);
  expect(rounds[1]).toEqual(expect.arrayContaining([
    expect.objectContaining({ athleteA: 3, athleteB: 4, winnerId: null, automatic: false }),
  ]));
  expect(rounds.at(-1)?.[0]).toMatchObject({ winnerId: null, automatic: false });
});
