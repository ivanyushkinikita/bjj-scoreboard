import { formatTime } from '../domain/timer';
import type { MatchState } from '../types/match';

const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

const safeFilenamePart = (value: string, fallback: string): string => {
  const sanitized = value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 60);
  return sanitized || fallback;
};

export function createMatchHistoryFilename(match: MatchState, date = new Date()): string {
  const athleteA = safeFilenamePart(match.competitorA.name, 'athlete-A');
  const athleteB = safeFilenamePart(match.competitorB.name, 'athlete-B');
  return `tatami-${athleteA}-vs-${athleteB}-${date.toISOString().slice(0, 10)}.csv`;
}

export function createMatchHistoryCsv(match: MatchState, locale: 'en' | 'ru'): string {
  const headers = locale === 'ru'
    ? ['Имя', 'Балл', 'Время начисления']
    : ['Name', 'Score', 'Scored at'];
  const rows = match.events
    .filter(event => event.competitor !== null && event.value !== undefined)
    .map(event => {
      const athlete = event.competitor === 'A' ? match.competitorA.name : match.competitorB.name;
      const score = `${event.value! > 0 ? '+' : ''}${event.value}`;
      return [athlete, score, formatTime(event.matchTime)].map(escapeCsv).join(';');
    });
  return `\uFEFF${[headers.map(escapeCsv).join(';'), ...rows].join('\r\n')}\r\n`;
}

export function downloadMatchHistoryCsv(match: MatchState, locale: 'en' | 'ru'): void {
  const blob = new Blob([createMatchHistoryCsv(match, locale)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = createMatchHistoryFilename(match);
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
