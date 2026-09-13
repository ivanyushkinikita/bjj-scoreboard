import type { MatchState, Side } from '../types/match';
import { calculateWinner } from './winner';
export type Sport = 'bjj' | 'grappling' | 'custom';
export type AthleteColor = 'red' | 'blue' | 'white';
export type ScoringAction = { label: string; points: number };
export type Rules = { sport: Sport; category: string; belt: string; actions: ScoringAction[] };
export const bjjActions: ScoringAction[] = [
  {label:'Takedown',points:2},{label:'Sweep',points:2},{label:'Knee on Belly',points:2},
  {label:'Guard Pass',points:3},{label:'Mount',points:4},{label:'Back Control',points:4},
];
export const grapplingActions: ScoringAction[] = [
  {label:'Out of bounds',points:1},{label:'Submission attack',points:1},{label:'Takedown',points:2},
  {label:'Amplitude takedown',points:3},{label:'Fast takedown bonus',points:2},{label:'Reversal',points:2},
  {label:'Side mount',points:3},{label:'Mount',points:4},{label:'Back Control',points:4},{label:'Failed challenge',points:2},
];
export const defaultRules = (): Rules => ({sport:'bjj',category:'adult',belt:'white',actions:bjjActions.map(a=>({...a}))});
export const categories = {
  bjj:['kids4','kids7','kids10','kids13','juvenile','adult','master1','master2','master3','master4','master5','master6','master7'],
  grappling:['u13','u15','u17','u20','senior','veterans'], custom:['custom'],
};
export const categoryLabels: Record<string,string> = {kids4:'4–6 years',kids7:'7–9 years',kids10:'10–12 years',kids13:'13–15 years',juvenile:'Juvenile · 16–17',adult:'Adult · 18+',master1:'Master 1 · 30+',master2:'Master 2 · 36+',master3:'Master 3 · 41+',master4:'Master 4 · 46+',master5:'Master 5 · 51+',master6:'Master 6 · 56+',master7:'Master 7 · 61+',u13:'U13 · 12–13',u15:'U15 · 14–15',u17:'U17 · 16–17',u20:'U20 · 18–20',senior:'Senior · 20+',veterans:'Veterans · 35–60',custom:'Custom category'};
export function ruleMinutes(r: Rules): number {
  if(r.sport==='grappling') return ['u13','u15','veterans'].includes(r.category)?4:5;
  if(r.sport==='custom') return 5;
  if(r.category==='kids4') return 2;
  if(r.category==='kids7') return 3;
  if(r.category.startsWith('kids')) return 4;
  if(r.category==='adult') return ({white:5,blue:6,purple:7,brown:8,black:10})[r.belt]??5;
  if(r.category==='master1') return ['white','blue'].includes(r.belt)?5:6;
  return 5;
}
export function penaltyAward(r: Rules, count: number, overtime = false): {points:number;advantages:number} {
  if(r.sport==='grappling') return {points:!overtime&&count>0&&count<4?count:!overtime&&count>=4?3:0,advantages:0};
  if(r.sport==='custom') return {points:0,advantages:0};
  return {points:count>=3?2+(r.category.startsWith('kids')?Math.max(0,Math.min(count,5)-3)*2:0):0,advantages:count>=2?1:0};
}
export function disqualificationLimit(r: Rules) { return r.sport==='custom'?Infinity:r.sport==='bjj'&&r.category.startsWith('kids')?6:4; }
export function matchWinner(s: MatchState): Side | null {
  const limit=disqualificationLimit(s.rules), dqA=s.competitorA.penalties>=limit, dqB=s.competitorB.penalties>=limit;
  if(dqA||dqB) return dqA===dqB?null:dqA?'B':'A';
  if(s.overtimeAttacker) return s.overtimeAttacker==='A'?'B':'A';
  if(s.rules.sport==='bjj') return calculateWinner(s.competitorA,s.competitorB);
  const difference=s.competitorA.points-s.competitorB.points;
  if(difference) return difference>0?'A':'B';
  if(s.rules.sport==='grappling') {
    // Active history only: undo removes actions; penalty awards also count as one-point actions.
    for(const value of [4,3,2,1]) {
      const counts={A:0,B:0};
      for(const a of s.past) {
        if(a.field==='points'&&a.after-a.before===value) counts[a.side]++;
        if(value===1&&a.field==='penalties'&&a.opponentPatch?.field==='points') counts[a.side==='A'?'B':'A']+=a.opponentPatch.after-a.opponentPatch.before;
      }
      if(counts.A!==counts.B) return counts.A>counts.B?'A':'B';
    }
    if(s.competitorA.penalties!==s.competitorB.penalties) return s.competitorA.penalties<s.competitorB.penalties?'A':'B';
  }
  return null;
}
export function resultReason(s:MatchState,side:Side): 'disqualification'|'technical'|'time'|'decision' {
  if((side==='A'?s.competitorB:s.competitorA).penalties>=disqualificationLimit(s.rules)) return 'disqualification';
  if(s.rules.sport==='grappling'&&(side==='A'?s.competitorA.points-s.competitorB.points:s.competitorB.points-s.competitorA.points)>=15) return 'technical';
  return s.status==='finished'&&s.result==='time'&&s.winner===side?'time':'decision';
}
