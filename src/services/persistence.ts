import type { MatchState } from '../types/match';
import { saveMatchDefaults } from './matchDefaults';
const KEY = 'tatami.match.v1';
export function saveMatch(match: MatchState) { saveMatchDefaults(match); localStorage.setItem(KEY, JSON.stringify({ version: 1, match })); }
export function loadMatch(): MatchState | null {
  const raw = localStorage.getItem(KEY); if (!raw) return null;
  const data = JSON.parse(raw);
  const s = data.match as MatchState;
  if (data.version !== 1 || !s || !['setup', 'ready', 'running', 'paused', 'finished'].includes(s.status) || !Array.isArray(s.events) || !Array.isArray(s.past) || !Array.isArray(s.future)) throw new Error('Saved match is invalid');
  for (const c of [s.competitorA, s.competitorB]) {
    if (!c || typeof c.name !== 'string' || ![c.points, c.advantages, c.penalties].every(n => Number.isSafeInteger(n) && n >= 0)) throw new Error('Saved scores are invalid');
    if(c.color!==undefined&&!['red','blue','white'].includes(c.color)) throw new Error('Saved color is invalid');
  }
  if(s.rules && (!['bjj','grappling','custom'].includes(s.rules.sport)||typeof s.rules.category!=='string'||typeof s.rules.belt!=='string'||!Array.isArray(s.rules.actions)||!s.rules.actions.length||s.rules.actions.some(a=>typeof a.label!=='string'||!a.label.trim()||!Number.isInteger(a.points)||a.points<1||a.points>99))) throw new Error('Saved rules are invalid');
  if (![s.initialDuration, s.remainingTime].every(n => Number.isFinite(n) && n >= 0) || (s.status === 'running' && !Number.isFinite(s.endTimestamp))) throw new Error('Saved timer is invalid');
  return s.status === 'setup' ? null : s;
}
