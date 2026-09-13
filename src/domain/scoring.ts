import type { Competitor, ScoreField } from '../types/match';
export function changeScore(competitor: Competitor, field: ScoreField, delta: number): Competitor {
  if (!Number.isSafeInteger(delta)) throw new Error('Score change must be an integer');
  return { ...competitor, [field]: Math.max(0, competitor[field] + delta) };
}
export const addPoints = (c: Competitor, points: 2 | 3 | 4) => changeScore(c, 'points', points);
export const addAdvantage = (c: Competitor, delta = 1) => changeScore(c, 'advantages', delta);
export const addPenalty = (c: Competitor, delta = 1) => changeScore(c, 'penalties', delta);
