import type { AthleteColor } from '../domain/rules';

/**
 * These options intentionally live in the draft even though only a knockout
 * bracket can be arranged today. It keeps future Olympic and round-robin
 * workflows from requiring a migration of tournament data.
 */
export type TournamentFormat = 'single-elimination' | 'round-robin' | 'free';
export type TournamentRuleset = 'standard' | 'olympic';
export const spectatorBackgrounds = ['none', 'arena-tatami', 'belts-smoke', 'ribbons-smoke', 'contour-fog', 'symmetric-smoke', 'custom'] as const;
export type SpectatorBackground = typeof spectatorBackgrounds[number];
export type SpectatorBackgroundImage = string | null;
export const spectatorAnimationPresets = ['arena-dust', 'floating-embers', 'minimal-energy'] as const;
export type SpectatorAnimationPreset = typeof spectatorAnimationPresets[number];
export const ANIMATABLE_SPECTATOR_BACKGROUNDS = new Set<SpectatorBackground>(['arena-tatami', 'belts-smoke', 'ribbons-smoke', 'contour-fog', 'symmetric-smoke']);
export function isAnimatableSpectatorBackground(background: SpectatorBackground): boolean {
  return ANIMATABLE_SPECTATOR_BACKGROUNDS.has(background);
}
export function normalizeSpectatorBackground(value: unknown): SpectatorBackground {
  return typeof value === 'string' && spectatorBackgrounds.includes(value as SpectatorBackground) ? value as SpectatorBackground : 'arena-tatami';
}
export function normalizeSpectatorBackgroundImage(value: unknown): SpectatorBackgroundImage {
  return typeof value === 'string' && value.length <= 7_100_000 && /^data:image\/(?:png|jpeg|webp|gif|bmp);base64,[a-z\d+/]+={0,2}$/i.test(value) ? value : null;
}
export function normalizeSpectatorAnimationPreset(value: unknown): SpectatorAnimationPreset {
  return typeof value === 'string' && spectatorAnimationPresets.includes(value as SpectatorAnimationPreset) ? value as SpectatorAnimationPreset : 'arena-dust';
}
export type TournamentDraft = {
  name: string;
  logo: string | null;
  spectatorBackground: SpectatorBackground;
  spectatorBackgroundImage?: SpectatorBackgroundImage;
  spectatorBackgroundAnimated?: boolean;
  spectatorAnimationPreset?: SpectatorAnimationPreset;
  spectatorTimerBackground?: boolean;
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
  freeMatches?: FreeTournamentMatch[];
};

export type FreeTournamentMatch = {
  id: string;
  athleteA: number;
  athleteB: number;
  winnerId: number;
  completedAt: number;
  athleteAName?: string;
  athleteBName?: string;
  winnerName?: string;
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
