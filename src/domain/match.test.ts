import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { addPoints, addAdvantage, addPenalty } from './scoring';
import { calculateWinner } from './winner';
import { formatTime, parseTime, remainingTime } from './timer';
import { useMatchStore } from '../stores/matchStore';
const athlete = { name: 'Ivan', points: 0, advantages: 0, penalties: 0 };
const get = () => useMatchStore.getState();
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(1000000); get().reset(); get().setup('Ivan','Petr',300000); });
afterEach(() => vi.useRealTimers());
describe('pure scoring', () => {
  it.each([2,3,4] as const)('adds %i points without mutation', n => { expect(addPoints(athlete,n).points).toBe(n); expect(athlete.points).toBe(0); });
  it('adds advantage', () => expect(addAdvantage(athlete).advantages).toBe(1));
  it('adds penalty', () => expect(addPenalty(athlete).penalties).toBe(1));
  it('never goes below zero', () => { expect(addAdvantage(athlete,-1).advantages).toBe(0); expect(addPenalty(athlete,-1).penalties).toBe(0); });
});
describe('winner priority', () => {
  it('uses points first', () => expect(calculateWinner({...athlete,points:2,penalties:3},{...athlete,advantages:4})).toBe('A'));
  it('uses advantages next', () => expect(calculateWinner(athlete,{...athlete,advantages:1,penalties:5})).toBe('B'));
  it('uses fewer penalties', () => expect(calculateWinner(athlete,{...athlete,penalties:1})).toBe('A'));
  it('leaves equal scores for referee decision', () => expect(calculateWinner(athlete,athlete)).toBeNull());
});
describe('match lifecycle', () => {
  it('undo / redo affect scoring without rewinding a running clock', () => {
    get().toggleTimer(); const end = get().match.endTimestamp;
    get().score('A','points',2); get().score('B','penalties',1);
    vi.advanceTimersByTime(18000); get().undo(); expect(get().match.competitorB.penalties).toBe(0);
    expect(get().match.endTimestamp).toBe(end); expect(remainingTime(get().match)).toBe(282000);
    get().redo(); expect(get().match.competitorB.penalties).toBe(1); expect(get().match.competitorA.points).toBe(2);
  });
  it('new score discards the redo branch', () => { get().score('A','points',2);get().undo();get().score('B','points',3);get().redo();expect(get().match.competitorA.points).toBe(0); });
  it('ignores lower-bound no-ops in undo history', () => { get().score('A','advantages',-1);expect(get().match.past).toHaveLength(0); });
  it('survives delayed event loop and expires once', () => { get().toggleTimer();vi.advanceTimersByTime(400000);get().tick();get().tick();expect(get().match.status).toBe('finished');expect(get().match.remainingTime).toBe(0);expect(get().match.events.filter(e=>e.type==='Time expired')).toHaveLength(1); });
  it('pauses, adjusts to 04:00, resumes and restores timestamp', () => { get().toggleTimer();vi.advanceTimersByTime(12000);get().toggleTimer();get().setTime(240000);expect(get().match.status).toBe('paused');get().toggleTimer();const saved=JSON.parse(JSON.stringify(get().match));vi.advanceTimersByTime(30000);get().replace(saved);expect(remainingTime(get().match)).toBe(210000); });
  it('adjusts running clock without pausing it', () => { get().toggleTimer();get().setTime(10000);vi.advanceTimersByTime(2000);expect(remainingTime(get().match)).toBe(8000); });
  it('submission stops the timer and locks scoring', () => { get().toggleTimer();vi.advanceTimersByTime(1000);get().finish('B','submission');get().score('A','points',4);expect(get().match.winner).toBe('B');expect(get().match.competitorA.points).toBe(0);expect(get().match.endTimestamp).toBeNull(); });
  it('recalculates provisional winner after a score correction', () => { get().score('A','points',2);get().toggleTimer();vi.advanceTimersByTime(300000);get().tick();expect(get().match.winner).toBe('A');get().undo();expect(get().match.winner).toBeNull();get().finish('B','decision');expect(get().match.confirmed).toBe(true); });
  it('new match clears all state', () => { get().score('A','points',4);get().finish('A','submission');get().reset();expect(get().match.status).toBe('setup');expect(get().match.events).toEqual([]);expect(get().match.winner).toBeNull();expect(get().match.competitorA.name).toBe(''); });
});
describe('time input', () => {
  it.each(['05:00','07:00','12:00','15:00'])('round trips %s', value => expect(formatTime(parseTime(value)!)).toBe(value));
  it.each(['5:99','-1:00','abc','1:2','1000:00'])('rejects %s', value => expect(parseTime(value)).toBeNull());
});
