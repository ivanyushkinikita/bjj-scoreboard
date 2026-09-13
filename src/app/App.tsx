import { useEffect, useRef, useState } from 'react';
import { canConfigureRules, canStartOvertime, clockDuration, useMatchStore } from '../stores/matchStore';
import type { MatchState, Side } from '../types/match';
import { formatTime, parseTime, remainingTime } from '../domain/timer';
import { loadMatch, saveMatch } from '../services/persistence';
import { closeDisplay, exitApplication, fullscreen, guardClose, isDisplay, monitors, moveDisplay, openDisplay, synchronize } from '../services/displayWindow';
import { playHorn, playStart, unlockAudio } from '../services/audio';
import { useSettingsStore, type Settings } from '../stores/settingsStore';
import { useTranslation } from './i18n';
import { TimeInput } from '../components/TimeInput';
import { MatchSetup } from '../components/MatchSetup';
import { CompetitorPanel } from '../components/CompetitorPanel';
import { EventLog } from '../components/EventLog';
import { RulesPicker } from '../components/RulesPicker';
import { disqualificationLimit, resultReason, type AthleteColor } from '../domain/rules';
import { Modal } from '../components/Modal';

type Dialog = 'history' | 'help' | 'time' | 'new' | 'reset' | 'submission' | 'decision' | 'display' | 'settings' | 'close' | 'editA' | 'editB' | 'overtime' | null;
export default function App() {
  const { t, locale } = useTranslation();
  const settings = useSettingsStore(state => state.settings);
  const store = useMatchStore(), s = store.match;
  const [dialog, setDialog] = useState<Dialog>(null), [value, setValue] = useState(''), [choice, setChoice] = useState<Side | null>(null);
  const [error, setError] = useState(''), [saved, setSaved] = useState<MatchState | null>(null), [booted, setBooted] = useState(false);
  const [monitorList, setMonitorList] = useState<Awaited<ReturnType<typeof monitors>>>([]);
  const [, renderTick] = useState(0);
  const overtimePrompt=useRef<string|null>(null);
  const openOvertime=()=>{setValue('01:00');setChoice(null);setDialog('overtime');};
  useEffect(()=>{
    const expiry=s.events.filter(e=>e.type==='Time expired').at(-1);
    if(!isDisplay && !saved && !dialog && canStartOvertime(s) && expiry && overtimePrompt.current!==expiry.id){
      overtimePrompt.current=expiry.id;
      openOvertime();
    }
  },[s,saved,dialog]);
  const run = (fn: () => Promise<unknown>) => { void fn().catch(e => setError(String(e))); };
  const changeSettings = (value: Partial<Settings>) => { try { useSettingsStore.getState().update(value); } catch { setError('Local save failed. Keep this window open until storage is available.'); } };
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  useEffect(() => {
    if (!isDisplay) { try { setSaved(loadMatch()); } catch { setError('The saved match could not be read. Start a new match to continue.'); } }
    setBooted(true);
    let disposed = false, off: (() => void) | undefined;
    void synchronize(setError).then(clean => { if (disposed) clean(); else off = clean; }).catch(e => setError(String(e)));
    return () => { disposed = true; off?.(); };
  }, []);
  useEffect(() => {
    const id = window.setInterval(() => { if (!isDisplay && !saved) useMatchStore.getState().tick(); renderTick(n => n + 1); }, 80);
    return () => clearInterval(id);
  }, [saved]);
  useEffect(() => {
    if (isDisplay || !booted || saved) return;
    const persist = () => {
      try { saveMatch(useMatchStore.getState().match); } catch { setError('Local save failed. Keep this window open until storage is available.'); }
    };
    persist();
    return useMatchStore.subscribe(persist);
  }, [booted, saved]);
  useEffect(() => {
    if (isDisplay) return;
    return useMatchStore.subscribe((next, prev) => {
      const sound = useSettingsStore.getState().settings;
      if (sound.startSound && prev.match.status === 'ready' && next.match.status === 'running') run(playStart);
      if (sound.endSound && next.match.result === 'time' && next.match.status === 'finished' && prev.match.status === 'running') run(playHorn);
    });
  }, []);
  useEffect(() => {
    if (isDisplay) return;
    let disposed = false, off: (() => void) | undefined;
    void guardClose(() => {
      const status = useMatchStore.getState().match.status;
      if (['ready','running','paused'].includes(status)) setDialog('close'); else run(exitApplication);
    }).then(clean => { if (disposed) clean(); else off = clean; }).catch(e => setError(String(e)));
    const unload = (e: BeforeUnloadEvent) => { if (['ready','running','paused'].includes(useMatchStore.getState().match.status)) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', unload);
    return () => { disposed = true; off?.(); window.removeEventListener('beforeunload', unload); };
  }, []);
  useEffect(() => {
    if (isDisplay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || (e.target as HTMLElement).closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])')) return;
      if (dialog || saved || document.querySelector('dialog[open]')) return;
      if (e.code === 'F11') { e.preventDefault(); run(() => fullscreen()); return; }
      if (s.status === 'setup') return;
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') { e.preventDefault(); e.shiftKey ? store.redo() : store.undo(); return; }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === 'Space') { e.preventDefault(); run(unlockAudio); store.toggleTimer(); return; }
      if (e.code === 'Backspace') { e.preventDefault(); if (!s.confirmed) setDialog('reset'); return; }
      const map: Record<string, [Side, 'points' | 'advantages' | 'penalties', number]> = { KeyQ:['A','points',2],KeyW:['A','points',3],KeyE:['A','points',4],KeyA:['A','advantages',1],KeyS:['A','penalties',1],KeyI:['B','points',2],KeyO:['B','points',3],KeyP:['B','points',4],KeyK:['B','advantages',1],KeyL:['B','penalties',1] };
      if (map[e.code] && (map[e.code][1]!=='points'||s.rules.actions.some(a=>a.points===map[e.code][2]))) { e.preventDefault(); store.score(...map[e.code]); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [dialog, saved, s.status, store]);
  const ms = remainingTime(s), winnerName = s.winner === 'A' ? s.competitorA.name : s.competitorB.name;
  const close = () => { setDialog(null); setChoice(null); };
  const edit = (side: Side) => { setValue(side === 'A' ? s.competitorA.name : s.competitorB.name); setDialog(side === 'A' ? 'editA' : 'editB'); };
  if (!booted) return null;
  return <div className={`app ${isDisplay ? 'display' : ''}`}>
    {!isDisplay && <header><a className="brand" href="#" onClick={e => e.preventDefault()}><span className="brand-mark">≋</span>{t("TATAMI")}<span className="brand-sub">{t("BJJ SCOREBOARD")}</span></a><div className="header-actions"><span className="offline"><span className="live-dot"/> {t("LOCAL / OFFLINE")}</span><button onClick={() => setDialog('help')} aria-label={t("Keyboard shortcuts")}>⌨ <span>{t("Shortcuts")}</span></button><button onClick={() => { run(openDisplay); }}>▣ <span>{t("Open Scoreboard Display")}</span></button><button aria-label={t("Settings")} onClick={() => setDialog('settings')}>⚙ <span>{t('Settings')}</span></button></div></header>}
    {error && !isDisplay && <div className="error" role="alert">{t(error.replace(/^Error: /,''))}<button onClick={() => setError('')}>{t("Dismiss")}</button></div>}
    {s.status === 'setup' && !isDisplay ? <MatchSetup/> : <main className="match">
      {s.overtimeAttacker && <div className="rules-alert">{t('Overtime')} · {t('Attacker')}: {s.overtimeAttacker==='A'?s.competitorA.name:s.competitorB.name}</div>}
      {!s.confirmed && (s.competitorA.penalties>=disqualificationLimit(s.rules)||s.competitorB.penalties>=disqualificationLimit(s.rules)||(s.rules.sport==='grappling'&&Math.abs(s.competitorA.points-s.competitorB.points)>=15)) && <div className="rules-alert">{t('Victory condition reached — referee confirmation required')}{!isDisplay&&<button onClick={()=>{setChoice(s.competitorA.penalties>=disqualificationLimit(s.rules)?'B':s.competitorB.penalties>=disqualificationLimit(s.rules)?'A':s.competitorA.points>s.competitorB.points?'A':'B');setDialog('decision');}}>{t('Confirm result')}</button>}</div>}
      <div className={`timer-block ${s.status === 'finished' && !s.confirmed ? 'expired' : ''}`}>{s.overtime&&<div className="regulation-clock" data-testid="regulation-clock"><span>{t('Regulation time')}</span><strong>{formatTime(s.overtime.regulationRemaining)}</strong><small>{t('Duration')}: {formatTime(s.initialDuration)}</small></div>}<div className="status">{s.overtime&&<span className="overtime-label">{t('Extra time')} · </span>}<span className={s.status === 'running' ? 'live-dot' : 'status-dot'}/>{t(s.status === 'finished' ? s.confirmed ? 'MATCH COMPLETE' : 'TIME EXPIRED' : s.status === 'setup' ? 'WAITING FOR MATCH' : s.status.toUpperCase())}</div>{isDisplay ? <div className="timer">{formatTime(ms)}</div> : <button className="timer" aria-label={t("Edit remaining time")} disabled={s.confirmed} onClick={() => { setValue(formatTime(ms)); setDialog('time'); }}>{formatTime(ms)}</button>}{!isDisplay && <button className="submission timer-submission" disabled={s.confirmed} onClick={() => setDialog('submission')}>{t("Submission")}</button>}<div className="timer-caption">{t(s.status === 'finished' ? s.confirmed ? 'FINAL RESULT' : 'REVIEW & CONFIRM RESULT' : isDisplay ? '\u00a0' : 'MATCH CLOCK · CLICK TO ADJUST')}</div></div>
      <div className="competitors"><CompetitorPanel side="A" competitor={s.competitorA} display={isDisplay} disabled={s.confirmed} edit={() => edit('A')}/><CompetitorPanel side="B" competitor={s.competitorB} display={isDisplay} disabled={s.confirmed} edit={() => edit('B')}/></div>
      <div className={`result-strip ${s.status === 'finished' ? 'visible' : ''}`} aria-live="polite">{s.status === 'finished' && <><span>{s.winner ? `${winnerName} ${t(s.confirmed ? 'WINS' : 'LEADS')}` : t(s.rules.sport==='grappling'?'OVERTIME REQUIRED':'REFEREE DECISION')}<small>{t(s.confirmed ? `BY ${s.result?.toUpperCase()}` : 'Preliminary result')}</small></span>{!isDisplay && !s.confirmed && <button onClick={() => { setChoice(s.winner); setDialog('decision'); }}>{t('Confirm result →')}</button>}{!isDisplay&&canStartOvertime(s)&&<button className="primary" onClick={openOvertime}>{t('Configure extra time')}</button>}</>}</div>
      {!isDisplay && <footer className="match-controls"><div><button disabled={!s.past.length || s.confirmed} onClick={store.undo}>{t("↶ Undo")}</button><button disabled={!s.future.length || s.confirmed} onClick={store.redo}>{t("↷ Redo")}</button><button onClick={() => setDialog('history')}>{t("History")}<span className="count">{s.events.length}</span></button></div><div><button className={`primary clock-control ${s.status === 'running' ? 'pause' : ''}`} disabled={s.status === 'finished'} onClick={() => { run(unlockAudio); store.toggleTimer(); }}>{s.status === 'running' ? 'Ⅱ ' : '▶ '}{t(s.status === 'running' ? 'PAUSE' : s.status === 'paused' ? 'RESUME' : 'START TIMER')}<kbd>{t("SPACE")}</kbd></button><button disabled={s.confirmed} onClick={() => setDialog('reset')} title="Backspace">{t("Reset timer")}</button></div><div><button onClick={() => setDialog('new')}>{t("New match")}</button></div></footer>}
    </main>}
    {s.confirmed&&s.showWinner&&s.winner&&<div className={`winner-celebration ${s.winner==='A'?s.competitorA.color:s.competitorB.color}`} role="dialog" aria-modal="true" aria-label={t('Winner')}><div className="winner-rays"/><div className="winner-content"><span className="winner-crown">★</span><p>{t('WINS')}</p><h1 style={{fontSize: winnerName.length>35?'clamp(40px, 7vw, 120px)':winnerName.length>20?'clamp(48px, 9vw, 160px)':'clamp(64px, 13vw, 220px)'}}>{winnerName}</h1><span>{t(`BY ${s.result?.toUpperCase()}`)}</span>{!isDisplay&&<button autoFocus onClick={()=>store.presentWinner(false)}>{t('Back to scoreboard')}</button>}</div></div>}
    {!isDisplay&&s.confirmed&&!s.showWinner&&<button className="winner-replay" onClick={()=>store.presentWinner(true)}>{t('Show winner')}</button>}
    {!isDisplay && <div className="bottom-line"><span>{t("PRECISION ON THE MAT.")}</span><span>{t("TATAMI / MATCH CONTROL")}<span className="live-dot"/></span></div>}
    {saved && !isDisplay && <Modal title="Welcome back to the mat"><p>{t("A previous match was saved locally.")}</p><div className="restore-summary">{saved.competitorA.name} <strong>{saved.competitorA.points} : {saved.competitorB.points}</strong> {saved.competitorB.name}</div><p>{t("Running clocks include the time elapsed while the application was closed.")}</p><div className="dialog-actions"><button onClick={() => { setSaved(null); store.reset(); }}>{t("START NEW MATCH")}</button><button className="primary" onClick={() => { run(unlockAudio); store.replace(saved); store.tick(); setSaved(null); }}>{t("RESTORE PREVIOUS MATCH")}</button></div></Modal>}
    {dialog && <Modal title={{ history:'Match history', help:'Keyboard shortcuts', time:'Adjust remaining time', new:'Start a new match?', reset:'Reset the match clock?', submission:'Submission victory', decision:'Confirm match result', display:'Scoreboard display', settings:'Settings', close:'Close application?', editA:'Edit competitor A', editB:'Edit competitor B', overtime:'Configure extra time' }[dialog]} close={close}>
      {dialog === 'history' && <EventLog events={s.events}/>}
      {dialog === 'help' && <p>{t('Backspace · Reset timer (with confirmation)')}</p>}
      {dialog === 'help' && <><div className="shortcut-grid"><div><h3>{t((s.competitorA.color||'blue').toUpperCase())+' · A'}</h3><p>{t("Q / W / E")}<b>+2 / +3 / +4</b></p><p>{t("A")}<b>{t("Advantage +")}</b></p><p>{t("S")}<b>{t("Penalty +")}</b></p></div><div><h3>{t((s.competitorB.color||'white').toUpperCase())+' · B'}</h3><p>{t("I / O / P")}<b>+2 / +3 / +4</b></p><p>{t("K")}<b>{t("Advantage +")}</b></p><p>{t("L")}<b>{t("Penalty +")}</b></p></div></div><p>{t("Space · Start / Pause / Resume")}</p><p>{t("Ctrl+Z · Undo &nbsp; Ctrl+Shift+Z · Redo")}</p><p>{t("F11 · Control window fullscreen")}</p><small>{t("Shortcuts are disabled while editing or when a dialog is open. Escape only dismisses dialogs.")}</small><button className="wide" onClick={() => run(playHorn)}>{t("Test end-of-match sound")}</button></>}
      {(dialog === 'time' || dialog === 'editA' || dialog === 'editB') && <form onSubmit={e => { e.preventDefault(); if (dialog === 'time') { const ms = parseTime(value); if (!ms) return; store.setTime(ms); } else store.rename(dialog === 'editA' ? 'A' : 'B', value); close(); }}><label>{t(dialog === 'time' ? 'Remaining time · MM:SS' : 'Athlete name')}{dialog === 'time' ? <TimeInput autoFocus label={t('Remaining time · MM:SS')} value={value} onChange={setValue}/> : <input autoFocus required maxLength={60} value={value} onChange={e => setValue(e.target.value)}/>}</label>{(dialog==='editA'||dialog==='editB')&&<label>{t('Athlete color')}<select value={(dialog==='editA'?s.competitorA:s.competitorB).color} onChange={e=>store.setColor(dialog==='editA'?'A':'B',e.target.value as AthleteColor)}>{(['red','blue','white'] as const).map(c=><option key={c} value={c} disabled={c===(dialog==='editA'?s.competitorB:s.competitorA).color}>{t(c.toUpperCase())}</option>)}</select></label>}{dialog === 'time' && <p>{t("The clock keeps its current running or paused state.")}</p>}<div className="dialog-actions"><button type="button" onClick={close}>{t("Cancel")}</button><button className="primary" disabled={dialog === 'time' ? !parseTime(value) : !value.trim()}>{t("Confirm change")}</button></div></form>}
      {(dialog === 'new' || dialog === 'reset' || dialog === 'close') && <><p>{t(dialog === 'new' ? 'Clear athletes, scores, history and timer, and return to setup?' : dialog === 'reset' ? 'Reset the clock to {time} and stop it? Scores remain unchanged.' : 'A match is currently running. Close application? Your match is saved, and a running clock continues to elapse.', {time: formatTime(clockDuration(s))})}</p><div className="dialog-actions"><button onClick={close}>{t("Cancel")}</button><button className="primary" onClick={() => { if (dialog === 'new') store.reset(); else if (dialog === 'reset') store.resetTimer(); else run(async () => { saveMatch(useMatchStore.getState().match); await exitApplication(); }); close(); }}>{t("Confirm")}</button></div></>}
      {(dialog === 'submission' || dialog === 'decision') && <><p>{t("Select the winner, then confirm the result.")}</p><div className="winner-options">{(['A','B'] as const).map(side => <button className={`winner-option ${side === 'A' ? s.competitorA.color : s.competitorB.color}`} aria-pressed={choice === side} key={side} onClick={() => setChoice(side)}>{t((side==='A'?s.competitorA.color||'blue':s.competitorB.color||'white').toUpperCase())}<strong>{side === 'A' ? s.competitorA.name : s.competitorB.name}</strong></button>)}</div>{choice && <p>{t(dialog === 'submission' ? 'Confirm submission victory for {name}?' : 'Confirm victory for {name}?', {name: choice === 'A' ? s.competitorA.name : s.competitorB.name})}</p>}<div className="dialog-actions"><button onClick={close}>{t("Cancel")}</button><button className="primary" disabled={!choice} onClick={() => { if (choice) store.finish(choice, dialog === 'submission' ? 'submission' : resultReason(s,choice)); close(); }}>{t("Confirm victory")}</button></div></>}
      {dialog==='overtime'&&<form onSubmit={e=>{e.preventDefault();const duration=parseTime(value);if(duration&&canStartOvertime(s)&&(s.rules.sport!=='grappling'||choice)){store.startOvertime(choice,duration);close();}}}>
        <p>{t('Extra time setup instructions')}</p>
        <label>{t('Extra time duration')}<TimeInput autoFocus label={t('Extra time duration')} value={value} onChange={setValue}/></label>
        {!parseTime(value)&&<p className="validation">{t('Enter a duration from 00:01 to 999:59.')}</p>}
        {s.rules.sport==='grappling'&&<><p>{t('Configured overtime instructions')}</p><div className="winner-options">{(['A','B'] as const).map(side=><button type="button" key={side} className={'winner-option '+(side==='A'?s.competitorA.color:s.competitorB.color)} aria-pressed={choice===side} onClick={()=>setChoice(side)}>{t('Attacker')}<strong>{side==='A'?s.competitorA.name:s.competitorB.name}</strong></button>)}</div></>}
        <div className="dialog-actions"><button type="button" onClick={close}>{t('Cancel')}</button><button className="primary" disabled={!parseTime(value)||!canStartOvertime(s)||(s.rules.sport==='grappling'&&!choice)}>{t('Set extra time')}</button></div>
      </form>}
      {dialog === 'settings' && <><h3>{t('Sport')}</h3><RulesPicker rules={s.rules} onChange={canConfigureRules(s)?store.configureRules:undefined}/>{!canConfigureRules(s)&&<small>{t('Rules are locked after the match starts. Start a new match to change them.')}</small>}<label>{t('Language')}<select aria-label={t('Language')} value={settings.locale} onChange={e => changeSettings({locale:e.target.value as 'en'|'ru'})}><option value="ru">Русский</option><option value="en">English</option></select></label><h3>{t('Sounds')}</h3><label className="check-option"><input type="checkbox" checked={settings.startSound} onChange={e => changeSettings({startSound:e.target.checked})}/><span>{t('Play sound when the match timer starts')}</span></label><label className="check-option"><input type="checkbox" checked={settings.endSound} onChange={e => changeSettings({endSound:e.target.checked})}/><span>{t('Play sound when time expires')}</span></label><small>{t('Sound settings are saved on this device. Start sound plays on Start, not on Resume.')}</small><div className="sound-tests"><button onClick={() => run(playStart)}>{t('Test start sound')}</button><button onClick={() => run(playHorn)}>{t('Test end-of-match sound')}</button></div><button className="wide" onClick={() => { setDialog('display'); run(async () => setMonitorList(await monitors())); }}>{t('Display settings')} →</button></>}
      {dialog === 'display' && <><p>{t("Move the spectator window to a monitor, then enable fullscreen.")}</p><div className="display-actions"><button onClick={() => run(openDisplay)}>{t("Open Scoreboard Display")}</button><button onClick={() => run(() => fullscreen(true))}>{t("Toggle display fullscreen")}</button><button onClick={() => run(closeDisplay)}>{t("Close display")}</button></div><label>{t("Available monitors")}<select defaultValue="" onChange={e => run(() => moveDisplay(Number(e.target.value)))}><option value="" disabled>{t("Select a monitor")}</option>{monitorList.map((m,i) => <option key={i} value={i}>{m.name || `Monitor ${i+1}`} · {m.size.width} × {m.size.height}</option>)}</select></label>{!monitorList.length && <small>{t("Monitor selection is available in the desktop application. You can also drag the display window manually.")}</small>}<button className="wide" onClick={() => run(() => fullscreen())}>{t("Toggle control fullscreen")}</button></>}
    </Modal>}
  </div>;
}
