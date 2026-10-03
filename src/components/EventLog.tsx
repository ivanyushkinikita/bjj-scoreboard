import type { MatchEvent } from '../types/match';
import { formatTime } from '../domain/timer';
import { eventLabel, useTranslation } from '../app/i18n';
export function EventLog({ events, onExport }: { events: MatchEvent[]; onExport?: () => void }) {
  const {t, locale} = useTranslation();
  const hasScores = events.some(event => event.competitor !== null && event.value !== undefined);
  return <><div className="event-log">{events.length === 0 && <p>{t("No events yet.")}</p>}{[...events].reverse().map(e => <div className="event" key={e.id}><time title={new Date(e.timestamp).toLocaleString(locale)}>{formatTime(e.matchTime)}</time><span className={e.competitor === 'A' ? 'text-blue' : ''}>{e.competitor || t('MATCH')}</span><span>{eventLabel(e.type,locale)}{e.value !== undefined ? ` ${e.value > 0 ? '+' : ''}${e.value}` : ''}</span></div>)}</div>{onExport && <button className="history-export" disabled={!hasScores} onClick={onExport}>{t('Export CSV')}</button>}</>;
}
