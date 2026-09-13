import { create } from 'zustand';
import type { MatchState, MatchEvent, ScoreField, Side, FinishReason } from '../types/match';
import { changeScore } from '../domain/scoring';
import { defaultRules, matchWinner, penaltyAward, ruleMinutes, type Rules, type AthleteColor } from '../domain/rules';
import { remainingTime } from '../domain/timer';

export const blankMatch = (): MatchState => ({
  competitorA: { name: '', points: 0, advantages: 0, penalties: 0, color:'blue' },
  competitorB: { name: '', points: 0, advantages: 0, penalties: 0, color:'white' },
  rules: defaultRules(), showWinner: false, overtimeAttacker:null,
  initialDuration: 300000, remainingTime: 300000, endTimestamp: null,
  status: 'setup', winner: null, result: null, confirmed: false, events: [], past: [], future: [],
});
function event(s: MatchState, type: string, competitor: Side | null = null, value?: number, relatedEventId?: string): MatchEvent {
  return { id: crypto.randomUUID(), timestamp: Date.now(), matchTime: remainingTime(s), competitor, type, value, relatedEventId };
}
const key = (side: Side) => side === 'A' ? 'competitorA' : 'competitorB';
export const canConfigureRules = (s:MatchState) => s.status==='setup'||(s.status==='ready'&&!s.events.some(e=>e.type==='Timer started')&&!s.past.length);
const canScore = (s: MatchState) => s.status !== 'setup' && !s.confirmed;
function provisional(s: MatchState): MatchState {
  return s.status === 'finished' && !s.confirmed ? { ...s, winner: matchWinner(s) } : s;
}
type Store = { match: MatchState; setup: (a: string, b: string, duration: number, rules?:Rules, colors?:[AthleteColor,AthleteColor]) => void; replace: (s: MatchState) => void; reset: () => void;
  configureRules:(rules:Rules)=>void;
  setColor:(side:Side,color:AthleteColor)=>void; presentWinner:(show:boolean)=>void; startOvertime:(attacker:Side)=>void;
  score: (side: Side, field: ScoreField, delta: number, label?: string) => void;
  undo: () => void; redo: () => void; toggleTimer: () => void; tick: () => void; setTime: (ms: number) => void; resetTimer: () => void;
  rename: (side: Side, name: string) => void; finish: (side: Side, reason: FinishReason) => void;
};
export const useMatchStore = create<Store>((set, get) => ({
  match: blankMatch(), replace: (match) => set({ match:{...blankMatch(),...match,competitorA:{color:'blue',...match.competitorA},competitorB:{color:'white',...match.competitorB}} }), reset: () => set({ match: blankMatch() }),
  configureRules:(rules)=>set(({match:s})=>!canConfigureRules(s)?{}:{match:{...s,rules:structuredClone(rules),initialDuration:ruleMinutes(rules)*60000,remainingTime:ruleMinutes(rules)*60000}}),
  setColor:(side,color)=>set(({match:s})=>s[key(side==='A'?'B':'A')].color===color?{}:{match:{...s,[key(side)]:{...s[key(side)],color}}}),
  presentWinner:(show)=>set(({match:s})=>({match:{...s,showWinner:show&&s.confirmed}})),
  startOvertime:(attacker)=>set(({match:s})=>s.rules.sport!=='grappling'||s.status!=='finished'||s.confirmed||s.winner||s.overtimeAttacker?{}:{match:{...s,overtimeAttacker:attacker,status:'ready',remainingTime:60000,initialDuration:60000,endTimestamp:null,result:null,events:[...s.events,event(s,'Overtime',attacker)]}}),
  setup: (a, b, duration, rules=defaultRules(), colors=['blue','white']) => {
    if (!a.trim() || !b.trim() || !Number.isFinite(duration) || duration <= 0) return;
    const match = blankMatch();
    match.rules=structuredClone(rules); match.competitorA.color=colors[0]; match.competitorB.color=colors[1];
    match.competitorA.name = a.trim(); match.competitorB.name = b.trim();
    match.initialDuration = duration; match.remainingTime = duration; match.status = 'ready';
    match.events = [event(match, 'Match created')]; set({ match });
  },
  score: (side, field, delta, label = field) => set(({ match: s }) => {
    if (!canScore(s) || !Number.isInteger(delta) || (field==='penalties'&&Math.abs(delta)!==1) || (field==='advantages'&&s.rules.sport!=='bjj') || (s.overtimeAttacker&&field==='points')) return {};
    const k = key(side), changed = changeScore(s[k], field, delta);
    if (changed[field] === s[k][field]) return {};
    const e = event(s, label, side, changed[field] - s[k][field]);
    const other=key(side==='A'?'B':'A');
    let opponent=s[other], opponentPatch;
    if(field==='penalties') {
      const before=penaltyAward(s.rules,s[k].penalties,!!s.overtimeAttacker), after=penaltyAward(s.rules,changed.penalties,!!s.overtimeAttacker);
      const f=after.points!==before.points?'points':'advantages';
      if(after[f]!==before[f]) { opponent=changeScore(opponent,f,after[f]-before[f]); opponentPatch={field:f as ScoreField,before:s[other][f],after:opponent[f]}; }
    }
    return { match: provisional({ ...s, [k]: changed, [other]:opponent, events: [...s.events, e], future: [], past: [...s.past, { id: e.id, side, field, before: s[k][field], after: changed[field], label, opponentPatch }] }) };
  }),
  undo: () => set(({ match: s }) => {
    const a = s.past.at(-1); if (!a || !canScore(s)) return {};
    const k = key(a.side);
    const other=key(a.side==='A'?'B':'A');
    if(a.opponentPatch) s={...s,[other]:{...s[other],[a.opponentPatch.field]:a.opponentPatch.before}};
    return { match: provisional({ ...s, [k]: { ...s[k], [a.field]: a.before }, past: s.past.slice(0, -1), future: [...s.future, a], events: [...s.events, event(s, `Undo · ${a.label}`, a.side, a.before - a.after, a.id)] }) };
  }),
  redo: () => set(({ match: s }) => {
    const a = s.future.at(-1); if (!a || !canScore(s)) return {};
    const k = key(a.side);
    const other=key(a.side==='A'?'B':'A');
    if(a.opponentPatch) s={...s,[other]:{...s[other],[a.opponentPatch.field]:a.opponentPatch.after}};
    return { match: provisional({ ...s, [k]: { ...s[k], [a.field]: a.after }, future: s.future.slice(0, -1), past: [...s.past, a], events: [...s.events, event(s, `Redo · ${a.label}`, a.side, a.after - a.before, a.id)] }) };
  }),
  tick: () => set(({ match: s }) => {
    if (s.status !== 'running' || remainingTime(s) > 0) return {};
    return { match: { ...s, remainingTime: 0, endTimestamp: null, status: 'finished', result: 'time', winner: matchWinner(s), events: [...s.events, event(s, 'Time expired')] } };
  }),
  toggleTimer: () => {
    get().tick();
    set(({ match: s }) => {
      if (s.status === 'setup' || s.status === 'finished') return {};
      const running = s.status === 'running', ms = remainingTime(s);
      return { match: { ...s, status: running ? 'paused' : 'running', remainingTime: ms, endTimestamp: running ? null : Date.now() + ms, events: [...s.events, event(s, running ? 'Timer paused' : s.status === 'ready' ? 'Timer started' : 'Timer resumed')] } };
    });
  },
  setTime: (ms) => set(({ match: s }) => {
    if (s.status === 'setup' || s.confirmed || !Number.isFinite(ms) || ms <= 0) return {};
    return { match: { ...s, remainingTime: ms, endTimestamp: s.status === 'running' ? Date.now() + ms : null, status: s.status === 'finished' ? 'paused' : s.status, winner: null, result: null, events: [...s.events, event(s, 'Time adjusted (milliseconds)', null, ms - remainingTime(s))] } };
  }),
  resetTimer: () => {
    const s = get().match; if (s.confirmed || s.status === 'setup') return;
    set({ match: { ...s, remainingTime: s.initialDuration, endTimestamp: null, status: 'ready', winner: null, result: null, events: [...s.events, event(s, 'Timer reset', null, s.initialDuration - remainingTime(s))] } });
  },
  rename: (side, name) => set(({ match: s }) => name.trim() ? { match: { ...s, [key(side)]: { ...s[key(side)], name: name.trim() }, events: [...s.events, event(s, `Name changed to ${name.trim()}`, side)] } } : {}),
  finish: (side, reason) => set(({ match: s }) => s.status === 'setup' || s.confirmed ? {} : { match: { ...s, remainingTime: remainingTime(s), endTimestamp: null, status: 'finished', winner: side, result: reason, confirmed: true, showWinner:true, events: [...s.events, event(s, `Victory by ${reason}`, side)] } }),
}));
