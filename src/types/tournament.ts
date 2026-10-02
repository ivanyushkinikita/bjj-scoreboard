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
  format: TournamentFormat;
  ruleset: TournamentRuleset;
};
