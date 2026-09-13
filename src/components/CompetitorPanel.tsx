import { useState } from 'react';
import type { Competitor, Side } from '../types/match';
import { useMatchStore } from '../stores/matchStore';
import { Modal } from './Modal';
import { useTranslation } from '../app/i18n';
export function CompetitorPanel({ side, competitor: c, display, disabled, edit }: { side: Side; competitor: Competitor; display: boolean; disabled: boolean; edit: () => void }) {
  const { t, locale } = useTranslation();
  const [menu, setMenu] = useState(false);
  const score = useMatchStore(s => s.score), blue = side === 'A';
  const match=useMatchStore(s=>s.match), actions=match.rules.actions, color=c.color||(blue?'blue':'white');
  const values=[...new Set(actions.map(a=>a.points))].sort((a,b)=>a-b);
  const fields=match.rules.sport==='bjj'?(['advantages','penalties'] as const):(['penalties'] as const);
  return <section className={`competitor ${color}`} aria-label={t('Competitor {side} scoreboard', {side})}>
    <div className="competitor-top"><span className="eyebrow">{t(color.toUpperCase())} <span className="side-id">/ {side}</span></span>{!display && <button className="edit" onClick={edit}>{t("EDIT")}</button>}</div>
    <h2 title={c.name}>{c.name || t(`Competitor ${side}`)}</h2><div className="score" data-testid={`score-${side}`}>{c.points}</div>
    <div className="stats">{fields.map(field => <div className={`stat ${field}`} key={field}><span>{t(field === 'advantages' ? 'ADVANTAGES' : 'PENALTIES')}</span><div>{!display && <button aria-label={t(`${side} {field} minus`, {field: locale === 'ru' ? t(field) : field})} disabled={disabled || c[field] === 0} onClick={() => score(side, field, -1)}>−</button>}<strong data-testid={`${field}-${side}`}>{c[field]}</strong>{!display && <button aria-label={t(`${side} {field} plus`, {field: locale === 'ru' ? t(field) : field})} disabled={disabled} onClick={() => score(side, field, 1)}>+</button>}</div></div>)}</div>
    {!display && <div className="score-controls"><div className="point-buttons">{values.map(n => <button key={n} aria-label={t(`${side} plus {n}`, {n})} disabled={disabled || !!match.overtimeAttacker} onClick={() => score(side, 'points', n, 'Points')}>+{n}<kbd>{({2:blue?'Q':'I',3:blue?'W':'O',4:blue?'E':'P'} as Record<number,string>)[n] || ''}</kbd></button>)}</div><button className="action-menu" disabled={disabled || !!match.overtimeAttacker} onClick={() => setMenu(true)}>{t('Scoring actions')}<span>↗</span></button></div>}
    {menu && <Modal title={`${t(color.toUpperCase())} · ${t('Scoring actions')}`} close={() => setMenu(false)}><div className="action-list">{actions.map(a => <button key={a.label} onClick={() => { score(side, 'points', a.points, a.label); setMenu(false); }}>{t(a.label)}<strong>+{a.points}</strong></button>)}</div></Modal>}
  </section>;
}
