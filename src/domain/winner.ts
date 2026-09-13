import type { Competitor, Side } from '../types/match';
export function calculateWinner(a: Competitor, b: Competitor): Side | null {
  for (const difference of [a.points - b.points, a.advantages - b.advantages, b.penalties - a.penalties]) {
    if (difference !== 0) return difference > 0 ? 'A' : 'B';
  }
  return null;
}
