import { describe, expect, it } from 'vitest';
import { blankMatch } from '../stores/matchStore';
import { createMatchHistoryCsv, createMatchHistoryFilename } from './matchHistoryCsv';

describe('createMatchHistoryCsv', () => {
  it('exports score changes with the athlete name and match-clock time', () => {
    const match = blankMatch();
    match.competitorA.name = 'Alex';
    match.competitorB.name = 'Sam';
    match.events = [
      { id: 'created', timestamp: 1, matchTime: 300000, competitor: null, type: 'Match created' },
      { id: 'score', timestamp: 2, matchTime: 258000, competitor: 'A', type: 'Takedown', value: 2 },
      { id: 'correction', timestamp: 3, matchTime: 240000, competitor: 'B', type: 'Points', value: -1 },
    ];

    expect(createMatchHistoryCsv(match, 'en')).toBe('\uFEFF"Name";"Score";"Scored at"\r\n"Alex";"+2";"04:18"\r\n"Sam";"-1";"04:00"\r\n');
  });

  it('uses both athlete names in the default export filename', () => {
    const match = blankMatch();
    match.competitorA.name = 'Иван / Иванов';
    match.competitorB.name = 'Maria: Silva';

    expect(createMatchHistoryFilename(match, new Date('2026-10-03T12:00:00.000Z')))
      .toBe('tatami-Иван Иванов-vs-Maria Silva-2026-10-03.csv');
  });
});
