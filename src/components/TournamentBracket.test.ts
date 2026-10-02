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
