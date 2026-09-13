import type { AthleteColor } from '../domain/rules';
import type { MatchState } from '../types/match';
export type MatchDefaults = { colors:[AthleteColor,AthleteColor]; duration:number };
const KEY='tatami.match-defaults.v1';
export function loadMatchDefaults():MatchDefaults {
  const fallback:MatchDefaults={colors:['blue','white'],duration:300000};
  try {
    const saved=JSON.parse(localStorage.getItem(KEY)||'null');
    const old=JSON.parse(localStorage.getItem('tatami.match.v1')||'null')?.match;
    const value=saved||{colors:[old?.competitorA?.color||'blue',old?.competitorB?.color||'white'],duration:old?.overtimeAttacker&&!old?.overtime?300000:old?.initialDuration};
    if(Array.isArray(value.colors)&&value.colors.length===2&&value.colors.every((c:unknown)=>typeof c==='string'&&['red','blue','white'].includes(c))&&value.colors[0]!==value.colors[1])fallback.colors=value.colors;
    if(Number.isInteger(value.duration)&&value.duration>=1000&&value.duration<=59999000)fallback.duration=value.duration;
  } catch { /* Invalid preferences fall back to the initial setup. */ }
  return fallback;
}
export function saveMatchDefaults(match:MatchState) {
  if(match.status==='setup')return;
  const defaults:MatchDefaults={colors:[match.competitorA.color||'blue',match.competitorB.color||'white'],duration:match.overtimeAttacker&&!match.overtime?loadMatchDefaults().duration:match.initialDuration};
  localStorage.setItem(KEY,JSON.stringify(defaults));
}
