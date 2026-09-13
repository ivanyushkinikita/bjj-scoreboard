import type { MatchState } from '../types/match';
export function remainingTime(state: Pick<MatchState, 'status' | 'endTimestamp' | 'remainingTime'>, now = Date.now()): number {
  return state.status === 'running' && state.endTimestamp !== null ? Math.max(0, state.endTimestamp - now) : state.remainingTime;
}
export function formatTime(ms: number): string {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}
export function parseTime(value: string): number | null {
  const match = /^(\d{1,3}):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  const result = (Number(match[1]) * 60 + Number(match[2])) * 1000;
  return result <= 999 * 60000 + 59000 ? result : null;
}
