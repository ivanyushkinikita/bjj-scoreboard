import { useEffect, useState } from 'react';
import { parseTime, formatTime } from '../domain/timer';
import { useMatchStore } from '../stores/matchStore';
import { useTranslation } from '../app/i18n';
import { categoryLabels, ruleMinutes, type AthleteColor } from '../domain/rules';
export function MatchSetup() {
  const {t}=useTranslation();
  const [a,setA]=useState(''),[b,setB]=useState(''),[time,setTime]=useState('05:00');
  const rules=useMatchStore(s=>s.match.rules);
  const [colors,setColors]=useState<[AthleteColor,AthleteColor]>(['blue','white']);
  useEffect(()=>setTime(formatTime(ruleMinutes(rules)*60000)),[rules]);
  const duration=parseTime(time);
  return <main className="setup centered-setup"><form className="setup-card" onSubmit={e=>{e.preventDefault();if(duration)useMatchStore.getState().setup(a,b,duration,rules,colors);}}>
    <div className="eyebrow">{t('MATCH SETUP')}</div><h2>{t('Let’s step onto the mat.')}</h2>
    <p className="setup-rule-summary">{t(rules.sport==='bjj'?'BJJ · IBJJF':rules.sport==='grappling'?'Grappling · UWW':'Custom scoring rules')} · {t(categoryLabels[rules.category])}<small>{t('Change rules in Settings')}</small></p>
    <div className="athlete-fields">{(['A','B'] as const).map((side,i)=><div className={`athlete-field color-${colors[i]}`} key={side}><label>{t(`Competitor ${side}`)}<input aria-label={t(`Competitor ${side}`)} required maxLength={60} placeholder={t('Athlete name')} value={i===0?a:b} onChange={e=>i===0?setA(e.target.value):setB(e.target.value)}/></label><label className="color-select">{t('Athlete color')}<select aria-label={`${t('Athlete color')} ${side}`} value={colors[i]} onChange={e=>{const next=[...colors] as [AthleteColor,AthleteColor];const previous=next[i];next[i]=e.target.value as AthleteColor;if(next[1-i]===next[i])next[1-i]=previous;setColors(next);}}>{(['red','blue','white'] as const).map(c=><option key={c} value={c}>{t(c.toUpperCase())}</option>)}</select></label></div>)}</div>
    <div className="duration-row"><label>{t('Match duration')}<input aria-label={t('Match duration')} className="time-input" value={time} onChange={e=>setTime(e.target.value)} placeholder={t('MM:SS')} aria-invalid={!duration}/></label><div><small>{t('Preset duration')}: {ruleMinutes(rules)}{t('m')}{duration!==ruleMinutes(rules)*60000?` · ${t('Manual time')}`:''}</small><div className="presets">{[2,3,4,5,6,7,8,10].map(n=><button className={duration===n*60000?'selected':''} type="button" key={n} onClick={()=>setTime(formatTime(n*60000))}>{n}{t('m')}</button>)}</div></div></div>
    {!duration&&<p className="validation">{t('Enter a duration from 00:01 to 999:59.')}</p>}
    <button className="primary setup-start" disabled={!duration||!a.trim()||!b.trim()}>{t('START MATCH')}<span>→</span></button><small>{t('The timer starts when you’re ready.')}</small>
  </form></main>;
}
