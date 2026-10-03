import type { AthleteColor } from '../domain/rules';

/**
 * These options intentionally live in the draft even though only a knockout
 * bracket can be arranged today. It keeps future Olympic and round-robin
 * workflows from requiring a migration of tournament data.
 */
export type TournamentFormat = 'single-elimination' | 'round-robin';
export type TournamentRuleset = 'standard' | 'olympic';
export type TournamentDraft = {
  name: string;
  matchDuration: number;
  competitors: string[];
  matchColors: [AthleteColor, AthleteColor];
  format: TournamentFormat;
  ruleset: TournamentRuleset;
};

export type TournamentState = {
  draft: TournamentDraft;
  seeds: (number | null)[];
  results: Record<string, number>;
  roundRobinMatchOrder?: string[];
  roundRobinView?: 'list' | 'table';
};

export type TournamentMatch = {
  id: string;
  round: number;
  index: number;
  athleteA: number | null;
  athleteB: number | null;
  winnerId: number | null;
  automatic: boolean;
};
