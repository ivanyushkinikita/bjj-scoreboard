import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {canStartOvertime,useMatchStore} from '../stores/matchStore';
import {remainingTime} from './timer';
import {defaultRules} from './rules';
const get=()=>useMatchStore.getState();
beforeEach(()=>{vi.useFakeTimers();vi.setSystemTime(1000000);get().reset();get().setup('A','B',300000);});
afterEach(()=>vi.useRealTimers());
function expire(){get().toggleTimer();vi.advanceTimersByTime(300000);get().tick();}
it('keeps regulation separate while extra time runs, pauses, resets and restores',()=>{
  get().score('A','points',2);get().score('B','points',2);expire();expect(canStartOvertime(get().match)).toBe(true);
  get().startOvertime(null,90000);expect(get().match.initialDuration).toBe(300000);expect(get().match.overtime).toEqual({duration:90000,regulationRemaining:0});expect(get().match.remainingTime).toBe(90000);expect(get().match.status).toBe('ready');
  get().toggleTimer();vi.advanceTimersByTime(10000);get().toggleTimer();expect(remainingTime(get().match)).toBe(80000);
  get().replace(JSON.parse(JSON.stringify(get().match)));get().setTime(20000);get().resetTimer();expect(get().match.remainingTime).toBe(90000);expect(get().match.initialDuration).toBe(300000);
  get().toggleTimer();get().score('A','points',2);vi.advanceTimersByTime(90000);get().tick();expect(get().match.winner).toBe('A');expect(get().match.overtime?.regulationRemaining).toBe(0);expect(canStartOvertime(get().match)).toBe(false);
});
it('requires expired equal points and a valid duration, and never reopens a confirmed match',()=>{
  get().startOvertime(null,90000);expect(get().match.overtime).toBeNull();get().score('A','points',2);expire();expect(canStartOvertime(get().match)).toBe(false);get().undo();
  for(const value of [0,-1,NaN,Infinity,60000000,1000.5]){get().startOvertime(null,value);expect(get().match.overtime).toBeNull();}
  get().finish('A','decision');get().startOvertime(null,90000);expect(get().match.overtime).toBeNull();
});
it('offers extra time for equal points even with an advantage, but excludes disqualification',()=>{
  get().score('A','advantages',1);expire();expect(get().match.winner).toBe('A');expect(canStartOvertime(get().match)).toBe(true);
  get().startOvertime(null,1000);expect(get().match.winner).toBeNull();get().reset();get().setup('A','B',300000);expire();
  get().replace({...get().match,competitorA:{...get().match.competitorA,penalties:4}});expect(canStartOvertime(get().match)).toBe(false);
});
it('preserves UWW attacker rules with configurable duration and migrates old overtime saves',()=>{
  get().setup('A','B',300000,{...defaultRules(),sport:'grappling'});expire();get().startOvertime(null,30000);expect(get().match.overtime).toBeNull();get().startOvertime('B',30000);get().score('B','points',4);expect(get().match.competitorB.points).toBe(0);get().toggleTimer();vi.advanceTimersByTime(30000);get().tick();expect(get().match.winner).toBe('A');
  const legacy=JSON.parse(JSON.stringify(get().match));delete legacy.overtime;legacy.initialDuration=60000;get().replace(legacy);expect(get().match.initialDuration).toBe(300000);expect(get().match.overtime?.duration).toBe(60000);
});
