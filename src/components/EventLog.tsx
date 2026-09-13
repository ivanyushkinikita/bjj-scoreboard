import type { MatchEvent } from '../types/match';
import { formatTime } from '../domain/timer';
import { eventLabel, useTranslation } from '../app/i18n';
export function EventLog({ events }: { events: MatchEvent[] }) {
  const {t, locale} = useTranslation();
  return <div className="event-log">{events.length === 0 && <p>{t("No events yet.")}</p>}{[...events].reverse().map(e => <div className="event" key={e.id}><time title={new Date(e.timestamp).toLocaleString(locale)}>{formatTime(e.matchTime)}</time><span className={e.competitor === 'A' ? 'text-blue' : ''}>{e.competitor || t('MATCH')}</span><span>{eventLabel(e.type,locale)}{e.value !== undefined ? ` ${e.value > 0 ? '+' : ''}${e.value}` : ''}</span></div>)}</div>;
}
