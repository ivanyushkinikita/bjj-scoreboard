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
import { MatchSetup, type MatchSetupDraft } from '../components/MatchSetup';
import { ModeSelection } from '../components/ModeSelection';
import { TournamentSetup } from '../components/TournamentSetup';
import { TournamentBracket } from '../components/TournamentBracket';
import { FreeTournament } from '../components/FreeTournament';
import { TournamentDisplayIntro, TournamentDisplayMatchup } from '../components/TournamentDisplay';
import { SpectatorBackground, SpectatorBackgroundPicker } from '../components/SpectatorBackground';
import { NameInput } from '../components/NameInput';
import { CompetitorPanel } from '../components/CompetitorPanel';
import { EventLog } from '../components/EventLog';
import { downloadMatchHistoryCsv } from '../services/matchHistoryCsv';
import { RulesPicker } from '../components/RulesPicker';
import { disqualificationLimit, resultReason, type AthleteColor } from '../domain/rules';
import { Modal } from '../components/Modal';
import { isAnimatableSpectatorBackground, type TournamentDraft, type TournamentMatch, type TournamentState } from '../types/tournament';

type Dialog = 'history' | 'help' | 'time' | 'new' | 'reset' | 'submission' | 'decision' | 'display' | 'settings' | 'close' | 'editA' | 'editB' | 'overtime' | 'returnTournament' | null;
type Mode = 'choice' | 'single' | 'tournamentSetup' | 'tournamentBracket' | 'freeTournament' | 'tournamentMatch';
export default function App() {
  const { t, locale } = useTranslation();
  const settings = useSettingsStore(state => state.settings);
  const store = useMatchStore(), s = store.match;
  const [dialog, setDialog] = useState<Dialog>(null), [value, setValue] = useState(''), [choice, setChoice] = useState<Side | null>(null);
  const [overtimeHelpOpen, setOvertimeHelpOpen] = useState(false);
  const [drawSelected, setDrawSelected] = useState(false);
  const [error, setError] = useState(''), [saved, setSaved] = useState<MatchState | null>(null), [booted, setBooted] = useState(false);
  const [mode, setMode] = useState<Mode>('choice');
  const [singleSetupDraft, setSingleSetupDraft] = useState<MatchSetupDraft | null>(null);
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [activeTournamentMatch, setActiveTournamentMatch] = useState<TournamentMatch | null>(null);
  const [monitorList, setMonitorList] = useState<Awaited<ReturnType<typeof monitors>>>([]);
  const [displayBackgroundDraft, setDisplayBackgroundDraft] = useState<Pick<Settings, 'spectatorBackground' | 'spectatorBackgroundImage' | 'spectatorBackgroundAnimated' | 'spectatorAnimationPreset' | 'spectatorTimerBackground'>>(() => ({ spectatorBackground: settings.spectatorBackground, spectatorBackgroundImage: settings.spectatorBackgroundImage, spectatorBackgroundAnimated: settings.spectatorBackgroundAnimated, spectatorAnimationPreset: settings.spectatorAnimationPreset, spectatorTimerBackground: settings.spectatorTimerBackground }));
  const [, renderTick] = useState(0);
  const expiryPrompt=useRef<string|null>(null);
  useEffect(() => {
    if (dialog === 'display') setDisplayBackgroundDraft({ spectatorBackground: settings.spectatorBackground, spectatorBackgroundImage: settings.spectatorBackgroundImage, spectatorBackgroundAnimated: settings.spectatorBackgroundAnimated, spectatorAnimationPreset: settings.spectatorAnimationPreset, spectatorTimerBackground: settings.spectatorTimerBackground });
  }, [dialog]);
  const openOvertime=()=>{setValue('01:00');setChoice(null);setOvertimeHelpOpen(false);setDialog('overtime');};
  useEffect(()=>{
    const expiry=s.events.filter(e=>e.type==='Time expired').at(-1);
    if(!isDisplay && !saved && !dialog && expiry && expiryPrompt.current!==expiry.id){
      expiryPrompt.current=expiry.id;
      if(canStartOvertime(s)) openOvertime();
      else { setChoice(s.winner); setDialog('decision'); }
    }
  },[s,saved,dialog]);
  const run = (fn: () => Promise<unknown>) => { void fn().catch(e => setError(String(e))); };
  const changeSettings = (value: Partial<Settings>) => { try { useSettingsStore.getState().update(value); } catch { setError('Local save failed. Keep this window open until storage is available.'); } };
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  useEffect(() => { document.documentElement.dataset.theme = settings.colorScheme; }, [settings.colorScheme]);
  useEffect(() => {
    if (!isDisplay && tournament) store.setTournamentPresentation({ name: tournament.draft.name.trim(), logo: tournament.draft.logo ?? null, spectatorBackground: tournament.draft.spectatorBackground, spectatorBackgroundImage: tournament.draft.spectatorBackgroundImage ?? null, spectatorBackgroundAnimated: tournament.draft.spectatorBackgroundAnimated ?? false, spectatorAnimationPreset: tournament.draft.spectatorAnimationPreset ?? 'arena-dust', spectatorTimerBackground: tournament.draft.spectatorTimerBackground ?? true });
  }, [tournament?.draft.name, tournament?.draft.logo, tournament?.draft.spectatorBackground, tournament?.draft.spectatorBackgroundImage, tournament?.draft.spectatorBackgroundAnimated, tournament?.draft.spectatorAnimationPreset, tournament?.draft.spectatorTimerBackground]);
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
      if (sound.startSound && prev.match.status === 'ready' && next.match.status === 'running') run(() => playStart(sound.startSoundVariant));
      if (sound.endSound && next.match.result === 'time' && next.match.status === 'finished' && prev.match.status === 'running') run(() => playHorn(sound.endSoundVariant));
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
      const map: Record<string, [Side, 'points' | 'advantages' | 'penalties', number]> = { KeyQ:['A','points',2],KeyW:['A','points',3],KeyE:['A','points',4],KeyR:['A','points',1],KeyF:['A','points',-1],KeyA:['A','advantages',1],KeyS:['A','penalties',1],KeyI:['B','points',2],KeyO:['B','points',3],KeyP:['B','points',4],KeyU:['B','points',1],KeyJ:['B','points',-1],KeyK:['B','advantages',1],KeyL:['B','penalties',1] };
      if (map[e.code] && (map[e.code][1]!=='points'||map[e.code][2]===1||map[e.code][2]===-1||s.rules.actions.some(a=>a.points===map[e.code][2]))) { e.preventDefault(); store.score(...map[e.code]); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [dialog, saved, s.status, store]);
  const ms = remainingTime(s), winnerName = s.winner === 'A' ? s.competitorA.name : s.competitorB.name;
  const close = () => { setDialog(null); setChoice(null); setDrawSelected(false); setOvertimeHelpOpen(false); };
  const syncDisplayBackground = (update: Partial<Pick<Settings, 'spectatorBackground' | 'spectatorBackgroundImage' | 'spectatorBackgroundAnimated' | 'spectatorAnimationPreset' | 'spectatorTimerBackground'>>) => {
    const currentPresentation = useMatchStore.getState().match.tournamentPresentation;
    const presentation = tournament
      ? { name: tournament.draft.name.trim(), logo: tournament.draft.logo ?? null }
      : { name: currentPresentation?.name ?? '', logo: currentPresentation?.logo ?? null };
    const currentBackground = {
      spectatorBackground: currentPresentation?.spectatorBackground ?? settings.spectatorBackground,
      spectatorBackgroundImage: currentPresentation?.spectatorBackgroundImage ?? settings.spectatorBackgroundImage,
      spectatorBackgroundAnimated: currentPresentation?.spectatorBackgroundAnimated ?? settings.spectatorBackgroundAnimated,
      spectatorAnimationPreset: currentPresentation?.spectatorAnimationPreset ?? settings.spectatorAnimationPreset,
      spectatorTimerBackground: currentPresentation?.spectatorTimerBackground ?? settings.spectatorTimerBackground,
    };
    changeSettings(update);
    store.setTournamentPresentation({ ...presentation, ...currentBackground, ...update });
    if (tournament) {
      setTournament(current => current ? { ...current, draft: { ...current.draft, ...update } } : current);
    }
  };
  const applyDisplayBackground = () => {
    syncDisplayBackground(displayBackgroundDraft);
    close();
  };
  const edit = (side: Side) => { setValue(side === 'A' ? s.competitorA.name : s.competitorB.name); setDialog(side === 'A' ? 'editA' : 'editB'); };
  const returnToSingleSetup = () => {
    const rules = structuredClone(s.rules);
    setSingleSetupDraft({ competitorA: s.competitorA.name, competitorB: s.competitorB.name, duration: remainingTime(s), colors: [s.competitorA.color ?? 'red', s.competitorB.color ?? 'blue'] });
    store.reset();
    store.configureRules(rules);
    setMode('single');
  };
  const startTournamentMatch = (match: TournamentMatch) => {
    if (activeTournamentMatch?.id === match.id) {
      setMode('tournamentMatch');
      return;
    }
    if (activeTournamentMatch) return;
    if (!tournament || match.athleteA === null || match.athleteB === null) return;
    const athleteA = tournament.draft.competitors[match.athleteA]?.trim();
    const athleteB = tournament.draft.competitors[match.athleteB]?.trim();
    if (!athleteA || !athleteB) return;
    store.setup(athleteA, athleteB, tournament.draft.matchDuration, s.rules, tournament.draft.matchColors);
    store.setTournamentPresentation({ name: tournament.draft.name.trim(), logo: tournament.draft.logo ?? null, spectatorBackground: tournament.draft.spectatorBackground, spectatorBackgroundImage: tournament.draft.spectatorBackgroundImage ?? null, spectatorBackgroundAnimated: tournament.draft.spectatorBackgroundAnimated ?? false, spectatorAnimationPreset: tournament.draft.spectatorAnimationPreset ?? 'arena-dust', spectatorTimerBackground: tournament.draft.spectatorTimerBackground ?? true });
    setActiveTournamentMatch(match);
    setMode('tournamentMatch');
  };
  const returnToTournamentBracket = (stopTimer: boolean) => {
    if (stopTimer && s.status === 'running') store.toggleTimer();
    close();
    setMode(tournament?.draft.format === 'free' ? 'freeTournament' : 'tournamentBracket');
  };
  const completeTournamentMatch = () => {
    if (!tournament || !activeTournamentMatch || !s.winner) return;
    const winnerId = s.winner === 'A' ? activeTournamentMatch.athleteA : activeTournamentMatch.athleteB;
    if (winnerId === null) return;
    setTournament(current => {
      if (!current) return current;
      const results = { ...current.results, [activeTournamentMatch.id]: winnerId };
      if (current.draft.format !== 'free' || activeTournamentMatch.athleteA === null || activeTournamentMatch.athleteB === null) return { ...current, results };
      return { ...current, results, freeMatches: [...(current.freeMatches ?? []), { id: activeTournamentMatch.id, athleteA: activeTournamentMatch.athleteA, athleteB: activeTournamentMatch.athleteB, winnerId, completedAt: Date.now(), athleteAName: s.competitorA.name, athleteBName: s.competitorB.name, winnerName: s.winner === 'A' ? s.competitorA.name : s.competitorB.name }] };
    });
    setActiveTournamentMatch(null);
    const presentation = s.tournamentPresentation;
    store.reset();
    store.setTournamentPresentation(presentation);
    setMode(tournament.draft.format === 'free' ? 'freeTournament' : 'tournamentBracket');
  };
  const startTournament = (draft: TournamentDraft, seeds: (number | null)[]) => {
    const activeSeeds = Array.from({ length: Math.ceil(seeds.length / 2) }, (_, index) => [seeds[index * 2] ?? null, seeds[index * 2 + 1] ?? null] as const)
      .filter(([athleteA, athleteB]) => athleteA !== null || athleteB !== null)
      .flat();
    store.setTournamentPresentation({ name: draft.name.trim(), logo: draft.logo ?? null, spectatorBackground: draft.spectatorBackground, spectatorBackgroundImage: draft.spectatorBackgroundImage ?? null, spectatorBackgroundAnimated: draft.spectatorBackgroundAnimated ?? false, spectatorAnimationPreset: draft.spectatorAnimationPreset ?? 'arena-dust', spectatorTimerBackground: draft.spectatorTimerBackground ?? true });
    setTournament({ draft: structuredClone(draft), seeds: activeSeeds, results: {}, roundRobinMatchOrder: [], roundRobinView: 'list', freeMatches: [] });
    setMode(draft.format === 'free' ? 'freeTournament' : 'tournamentBracket');
  };
  if (!booted) return null;
  const spectatorBackground = s.tournamentPresentation?.spectatorBackground ?? settings.spectatorBackground;
  const spectatorBackgroundImage = s.tournamentPresentation?.spectatorBackgroundImage ?? settings.spectatorBackgroundImage;
  const spectatorBackgroundAnimated = s.tournamentPresentation?.spectatorBackgroundAnimated ?? settings.spectatorBackgroundAnimated;
  const spectatorAnimationPreset = s.tournamentPresentation?.spectatorAnimationPreset ?? settings.spectatorAnimationPreset;
  const spectatorTimerBackground = s.tournamentPresentation?.spectatorTimerBackground ?? settings.spectatorTimerBackground;
  const timerWasStarted = s.status === 'running' || s.status === 'paused' || s.status === 'finished' || s.events.some(event => event.type === 'Timer started' || event.type === 'Timer resumed');
  if (isDisplay && spectatorBackground !== 'none') {
    const namesAreKnown = Boolean(s.competitorA.name.trim() && s.competitorB.name.trim());
    const presentation = s.tournamentPresentation ?? { name: '', logo: null, spectatorBackground, spectatorBackgroundImage, spectatorBackgroundAnimated, spectatorAnimationPreset, spectatorTimerBackground };
    if (!namesAreKnown) return <div className="app display"><TournamentDisplayIntro presentation={presentation} showBranding={Boolean(s.tournamentPresentation)}/></div>;
    if (!timerWasStarted) return <div className="app display"><TournamentDisplayMatchup athleteA={s.competitorA.name} athleteB={s.competitorB.name} colorA={s.competitorA.color ?? 'var(--athlete-red)'} colorB={s.competitorB.color ?? 'var(--athlete-blue)'} spectatorBackground={spectatorBackground} spectatorBackgroundImage={spectatorBackgroundImage} spectatorBackgroundAnimated={spectatorBackgroundAnimated} spectatorAnimationPreset={spectatorAnimationPreset}/></div>;
  }
  return <div className={`app ${isDisplay ? 'display' : ''}`}>
    {isDisplay && (!timerWasStarted || spectatorTimerBackground) && <SpectatorBackground variant={spectatorBackground} image={spectatorBackgroundImage} animated={spectatorBackgroundAnimated} preset={spectatorAnimationPreset}/>}
    {!isDisplay && <header><a className="brand" href="#" onClick={e => e.preventDefault()}><span className="brand-mark">≋</span>{t("TATAMI")}<span className="brand-sub">{t("BJJ SCOREBOARD")}</span></a><div className="header-actions"><span className="offline"><span className="live-dot"/> {t("LOCAL / OFFLINE")}</span><button onClick={() => setDialog('help')} aria-label={t("Keyboard shortcuts")}>⌨ <span>{t("Shortcuts")}</span></button><button onClick={() => { run(openDisplay); }}>▣ <span>{t("Open Scoreboard Display")}</span></button><button aria-label={t("Settings")} onClick={() => setDialog('settings')}>⚙ <span>{t('Settings')}</span></button></div></header>}
    {error && !isDisplay && <div className="error" role="alert">{t(error.replace(/^Error: /,''))}<button onClick={() => setError('')}>{t("Dismiss")}</button></div>}
    {!isDisplay && mode === 'tournamentBracket' && tournament ? <TournamentBracket tournament={tournament} activeMatchId={activeTournamentMatch?.id ?? null} onStartMatch={startTournamentMatch} onReplayMatch={match => { setTournament(current => { if (!current) return current; const results = { ...current.results }; delete results[match.id]; return { ...current, results }; }); startTournamentMatch(match); }} onReorderRoundRobinMatches={matchIds => setTournament(current => current ? { ...current, roundRobinMatchOrder: matchIds } : current)} onRoundRobinViewChange={view => setTournament(current => current ? { ...current, roundRobinView: view } : current)} onBack={() => setMode('tournamentSetup')} onResumeMatch={() => setMode('tournamentMatch')} onExit={() => { setActiveTournamentMatch(null); store.reset(); setTournament(null); setMode('choice'); }}/> : !isDisplay && mode === 'freeTournament' && tournament ? <FreeTournament tournament={tournament} activeMatchId={activeTournamentMatch?.id ?? null} onStartMatch={startTournamentMatch} onAddAthlete={name => setTournament(current => current ? { ...current, draft: { ...current.draft, competitors: [...current.draft.competitors, name] } } : current)} onRemoveAthlete={athleteId => setTournament(current => current ? { ...current, draft: { ...current.draft, competitors: current.draft.competitors.map((name, index) => index === athleteId ? '' : name) } } : current)} onBack={() => setMode('tournamentSetup')} onResumeMatch={() => setMode('tournamentMatch')} onExit={() => { setActiveTournamentMatch(null); store.reset(); setTournament(null); setMode('choice'); }}/> : s.status === 'setup' && !isDisplay ? mode === 'choice' ? <ModeSelection onSingleMatch={()=>{setSingleSetupDraft(null);setMode('single');}} onTournament={()=>setMode('tournamentSetup')}/> : mode === 'tournamentSetup' ? <TournamentSetup tournament={tournament} onBack={() => setMode(tournament ? tournament.draft.format === 'free' ? 'freeTournament' : 'tournamentBracket' : 'choice')} onStart={(draft, seeds) => { if (!tournament) { startTournament(draft, seeds); return; } setTournament(current => current ? { ...current, draft: structuredClone(draft), seeds: [...seeds] } : current); setMode(draft.format === 'free' ? 'freeTournament' : 'tournamentBracket'); }}/> : <MatchSetup initial={singleSetupDraft ?? undefined} onInitialConsumed={() => setSingleSetupDraft(null)} onBack={()=>setMode('choice')}/> : <main className={`match ${activeTournamentMatch ? 'tournament-scoreboard' : ''}`}>
      {!isDisplay && activeTournamentMatch && <button className="tournament-match-back" disabled={s.confirmed} onClick={() => s.events.some(event => event.type === 'Timer started') ? setDialog('returnTournament') : returnToTournamentBracket(false)}>{t('Back to bracket')}</button>}
      {s.overtimeAttacker && <div className="rules-alert">{t('Overtime')} · {t('Attacker')}: {s.overtimeAttacker==='A'?s.competitorA.name:s.competitorB.name}</div>}
      {!s.confirmed && (s.competitorA.penalties>=disqualificationLimit(s.rules)||s.competitorB.penalties>=disqualificationLimit(s.rules)||(s.rules.sport==='grappling'&&Math.abs(s.competitorA.points-s.competitorB.points)>=15)) && <div className="rules-alert">{t('Victory condition reached — referee confirmation required')}{!isDisplay&&<button onClick={()=>{setChoice(s.competitorA.penalties>=disqualificationLimit(s.rules)?'B':s.competitorB.penalties>=disqualificationLimit(s.rules)?'A':s.competitorA.points>s.competitorB.points?'A':'B');setDialog('decision');}}>{t('Confirm result')}</button>}</div>}
      <div className={`timer-block ${s.status === 'finished' && !s.confirmed ? 'expired' : ''}`}><div className="status">{s.overtime&&<span className="overtime-label">{t('Extra time')} · </span>}<span className={s.status === 'running' ? 'live-dot' : 'status-dot'}/>{t(s.status === 'finished' ? s.confirmed ? 'MATCH COMPLETE' : 'TIME EXPIRED' : s.status === 'setup' ? 'WAITING FOR MATCH' : s.status.toUpperCase())}</div>{isDisplay ? <div className="timer">{formatTime(ms)}</div> : <button className="timer" aria-label={t("Edit remaining time")} disabled={s.confirmed} onClick={() => { setValue(formatTime(ms)); setDialog('time'); }}>{formatTime(ms)}</button>}{!isDisplay && <button className="submission timer-submission" disabled={s.confirmed} onClick={() => setDialog('submission')}>{t("Submission")}</button>}{!isDisplay && s.status === 'finished' && !s.confirmed && <button className="timer-confirm-result" onClick={() => { setChoice(s.winner); setDialog('decision'); }}>{t('Confirm result')}</button>}<div className="timer-caption">{t(s.status === 'finished' ? s.confirmed ? 'FINAL RESULT' : 'REVIEW & CONFIRM RESULT' : isDisplay ? '\u00a0' : 'MATCH CLOCK · CLICK TO ADJUST')}</div></div>
      <div className="competitors"><CompetitorPanel side="A" competitor={s.competitorA} display={isDisplay} disabled={s.confirmed} edit={() => edit('A')}/><CompetitorPanel side="B" competitor={s.competitorB} display={isDisplay} disabled={s.confirmed} edit={() => edit('B')}/></div>
      {isDisplay && <div className={`result-strip ${s.status === 'finished' ? 'visible' : ''}`} aria-live="polite">{s.status === 'finished' && <span>{s.confirmed && s.result === 'draw' ? t('Draw') : s.winner ? `${winnerName} ${t(s.confirmed ? 'WINS' : 'LEADS')}` : t(s.rules.sport==='grappling'?'OVERTIME REQUIRED':'REFEREE DECISION')}<small>{t(s.confirmed ? s.result === 'draw' ? 'Draw' : `BY ${s.result?.toUpperCase()}` : 'Preliminary result')}</small></span>}</div>}
      {!isDisplay && canStartOvertime(s) && <div className="result-strip visible"><button className="primary" onClick={openOvertime}>{t('Configure extra time')}</button></div>}
      {!isDisplay && <footer className="match-controls"><div><button disabled={!s.past.length || s.confirmed} onClick={store.undo}>{t("↶ Undo")}</button><button disabled={!s.future.length || s.confirmed} onClick={store.redo}>{t("↷ Redo")}</button><button onClick={() => setDialog('history')}>{t("History")}<span className="count">{s.events.length}</span></button></div><div><button className={`primary clock-control ${s.status === 'running' ? 'pause' : ''}`} disabled={s.status === 'finished'} onClick={() => { run(unlockAudio); store.toggleTimer(); }}>{t(s.status === 'running' ? 'PAUSE' : s.status === 'paused' ? 'RESUME' : 'START TIMER')}<kbd>{t("SPACE")}</kbd></button><button disabled={s.confirmed} onClick={() => setDialog('reset')} title="Backspace">{t("Reset timer")}</button></div><div>{!activeTournamentMatch && <><button className="match-back" disabled={!canConfigureRules(s)} onClick={returnToSingleSetup}>{t('Back')}</button><button onClick={() => setDialog('new')}>{t("New match")}</button></>}</div></footer>}
    </main>}
    {s.confirmed&&s.showWinner&&s.winner&&<div className={`winner-celebration ${s.winner==='A'?s.competitorA.color:s.competitorB.color}`} role="dialog" aria-modal="true" aria-label={t('Winner')}><div className="winner-rays"/><div className="winner-content"><p>{t('WINS')}</p><h1 style={{fontSize: winnerName.length>35?'clamp(40px, 7vw, 120px)':winnerName.length>20?'clamp(48px, 9vw, 160px)':'clamp(64px, 13vw, 220px)'}}>{winnerName}</h1><span>{t(`BY ${s.result?.toUpperCase()}`)}</span>{!isDisplay && (activeTournamentMatch ? <button autoFocus onClick={completeTournamentMatch}>{t('Back to tournament')}</button> : <div className="winner-actions"><button autoFocus onClick={()=>{store.reset();setMode('single');}}>{t('Create next match')}</button><button onClick={()=>{store.reset();setMode('choice');}}>{t('Main screen')}</button></div>)}</div>{!isDisplay && <button className="winner-history-export" onClick={() => downloadMatchHistoryCsv(s, locale)}>{t('Export match history')}</button>}</div>}
    {!isDisplay&&s.confirmed&&s.winner&&!s.showWinner&&<button className="winner-replay" onClick={()=>store.presentWinner(true)}>{t('Show winner')}</button>}
    {saved && !isDisplay && <Modal title="Welcome back to the mat"><p>{t("A previous match was saved locally.")}</p><div className="restore-summary">{saved.competitorA.name} <strong>{saved.competitorA.points} : {saved.competitorB.points}</strong> {saved.competitorB.name}</div><p>{t("Running clocks include the time elapsed while the application was closed.")}</p><div className="dialog-actions"><button onClick={() => { setSaved(null); store.reset(); setMode('single'); }}>{t("START NEW MATCH")}</button><button className="primary" onClick={() => { expiryPrompt.current=saved.events.filter(e=>e.type==='Time expired').at(-1)?.id||null; run(unlockAudio); store.replace(saved); store.tick(); setSaved(null); }}>{t("RESTORE PREVIOUS MATCH")}</button></div></Modal>}
    {dialog && <Modal title={{ history:'Match history', help:'Keyboard shortcuts', time:'Adjust remaining time', new:'Start a new match?', reset:'Reset the match clock?', submission:'Submission victory', decision:'Confirm match result', display:'Scoreboard display', settings:'Settings', close:'Close application?', editA:'Edit competitor A', editB:'Edit competitor B', overtime:'Extra Time', returnTournament:'Return to bracket' }[dialog]} titleAccessory={dialog === 'overtime' ? <div className={`overtime-help ${overtimeHelpOpen ? 'open' : ''}`}><button type="button" aria-label={t('Extra time setup instructions')} aria-expanded={overtimeHelpOpen} onClick={() => setOvertimeHelpOpen(current => !current)}>?</button><span role="tooltip">{t('Extra time setup instructions')}</span></div> : undefined} close={close} closeOnBackdrop={dialog === 'settings' || dialog === 'display' || dialog === 'submission' || dialog === 'decision'}>
      {dialog === 'history' && <EventLog events={s.events} onExport={() => downloadMatchHistoryCsv(s, locale)}/>}
      {dialog === 'help' && <p>{t('Backspace · Reset timer (with confirmation)')}</p>}
      {dialog === 'help' && <><div className="shortcut-grid"><div><h3>{t((s.competitorA.color||'blue').toUpperCase())+' · A'}</h3><p>{t("Q / W / E")}<b>+2 / +3 / +4</b></p><p>{t("A")}<b>{t("Advantage +")}</b></p><p>{t("S")}<b>{t("Penalty +")}</b></p></div><div><h3>{t((s.competitorB.color||'white').toUpperCase())+' · B'}</h3><p>{t("I / O / P")}<b>+2 / +3 / +4</b></p><p>{t("K")}<b>{t("Advantage +")}</b></p><p>{t("L")}<b>{t("Penalty +")}</b></p></div></div><p>{t("Space · Start / Pause / Resume")}</p><p>{t("Ctrl+Z · Undo &nbsp; Ctrl+Shift+Z · Redo")}</p><p>{t("F11 · Control window fullscreen")}</p><small>{t("Shortcuts are disabled while editing or when a dialog is open. Escape only dismisses dialogs.")}</small></>}
      {(dialog === 'time' || dialog === 'editA' || dialog === 'editB') && <form onSubmit={e => { e.preventDefault(); if (dialog === 'time') { const ms = parseTime(value); if (!ms) return; store.setTime(ms); } else store.rename(dialog === 'editA' ? 'A' : 'B', value); close(); }}><label>{t(dialog === 'time' ? 'Remaining time · MM:SS' : 'Athlete name')}{dialog === 'time' ? <TimeInput autoFocus label={t('Remaining time · MM:SS')} value={value} onChange={setValue}/> : <NameInput autoFocus required maxLength={60} value={value} onChange={setValue}/>}</label>{(dialog==='editA'||dialog==='editB')&&<label>{t('Athlete color')}<select value={(dialog==='editA'?s.competitorA:s.competitorB).color} onChange={e=>store.setColor(dialog==='editA'?'A':'B',e.target.value as AthleteColor)}>{(['red','blue','white'] as const).map(c=><option key={c} value={c} disabled={c===(dialog==='editA'?s.competitorB:s.competitorA).color}>{t(c.toUpperCase())}</option>)}</select></label>}{dialog === 'time' && <p>{t("The clock keeps its current running or paused state.")}</p>}<div className="dialog-actions"><button type="button" onClick={close}>{t("Cancel")}</button><button className="primary" disabled={dialog === 'time' ? !parseTime(value) : !value.trim()}>{t("Confirm change")}</button></div></form>}
      {(dialog === 'new' || dialog === 'reset' || dialog === 'close') && <><p>{t(dialog === 'new' ? 'Clear athletes, scores, history and timer, and return to setup?' : dialog === 'reset' ? 'Reset the clock to {time} and stop it? Scores remain unchanged.' : 'A match is currently running. Close application? Your match is saved, and a running clock continues to elapse.', {time: formatTime(clockDuration(s))})}</p><div className="dialog-actions"><button onClick={close}>{t("Cancel")}</button><button className="primary" onClick={() => { if (dialog === 'new') { store.reset(); setMode('single'); } else if (dialog === 'reset') store.resetTimer(); else run(async () => { saveMatch(useMatchStore.getState().match); await exitApplication(); }); close(); }}>{t("Confirm")}</button></div></>}
      {dialog === 'returnTournament' && <><p>{t('Return to the tournament bracket?')}</p><div className="dialog-actions"><button onClick={close}>{t('Cancel')}</button><button onClick={() => returnToTournamentBracket(false)}>{t('Keep timer running')}</button><button className="primary" onClick={() => returnToTournamentBracket(true)}>{t('Stop timer and return')}</button></div></>}
      {(dialog === 'submission' || dialog === 'decision') && <><p>{t("Select the winner, then confirm the result.")}</p><div className="winner-options">{(['A','B'] as const).map(side => <button className={`winner-option ${side === 'A' ? s.competitorA.color : s.competitorB.color}`} aria-pressed={choice === side} key={side} onClick={() => { setChoice(side); setDrawSelected(false); }}><strong>{side === 'A' ? s.competitorA.name : s.competitorB.name}</strong></button>)}</div>{dialog === 'decision' && !activeTournamentMatch && s.competitorA.points === s.competitorB.points && <button className="draw-option draw-result-option" aria-pressed={drawSelected} onClick={() => { setChoice(null); setDrawSelected(true); }}>{t('Draw')}</button>}<div className="dialog-actions"><button onClick={close}>{t("Cancel")}</button><button className="primary" disabled={!choice && !drawSelected} onClick={() => { if (drawSelected) store.finishDraw(); else if (choice) store.finish(choice, dialog === 'submission' ? 'submission' : resultReason(s,choice)); close(); }}>{t(drawSelected ? 'Confirm draw' : 'Confirm victory')}</button></div></>}
      {dialog==='overtime'&&<form className="overtime-form" onSubmit={e=>{e.preventDefault();const duration=parseTime(value);if(duration&&canStartOvertime(s)&&(s.rules.sport!=='grappling'||choice)){store.startOvertime(choice,duration);close();}}}>
        <label className="overtime-duration">{t('Extra time duration')}<TimeInput autoFocus label={t('Extra time duration')} value={value} onChange={setValue}/></label>
        {!parseTime(value)&&<p className="validation">{t('Enter a duration from 00:01 to 99:59.')}</p>}
        {s.rules.sport==='grappling'&&<><p>{t('Configured overtime instructions')}</p><div className="winner-options">{(['A','B'] as const).map(side=><button type="button" key={side} className={'winner-option '+(side==='A'?s.competitorA.color:s.competitorB.color)} aria-pressed={choice===side} onClick={()=>setChoice(side)}>{t('Attacker')}<strong>{side==='A'?s.competitorA.name:s.competitorB.name}</strong></button>)}</div></>}
        <div className="dialog-actions"><button type="button" onClick={close}>{t('Cancel')}</button><button className="primary" disabled={!parseTime(value)||!canStartOvertime(s)||(s.rules.sport==='grappling'&&!choice)}>{t('Set extra time')}</button></div>
      </form>}
      {dialog === 'settings' && <><h3>{t('Sport')}</h3><RulesPicker rules={s.rules} onChange={canConfigureRules(s)?store.configureRules:undefined}/>{!canConfigureRules(s)&&<small>{t('Rules are locked after the match starts. Start a new match to change them.')}</small>}<label>{t('Language')}<select aria-label={t('Language')} value={settings.locale} onChange={e => changeSettings({locale:e.target.value as 'en'|'ru'})}><option value="ru">Русский</option><option value="en">English</option></select></label><label>{t('Theme')}<select aria-label={t('Theme')} value={settings.colorScheme} onChange={e => changeSettings({colorScheme:e.target.value as Settings['colorScheme']})}><option value="dark">{t('Dark')}</option><option value="light">{t('Light')}</option></select></label><h3>{t('Sounds')}</h3><div className="sound-settings-grid"><fieldset className="sound-setting"><legend>{t('Start-of-match gong')}</legend><label className="sound-choice"><input type="checkbox" checked={settings.startSound} onChange={e => changeSettings({startSound:e.target.checked})}/><span>{t('Play sound when the match timer starts')}</span></label><select className="sound-select" aria-label={t('Start-of-match gong')} value={settings.startSoundVariant} onChange={e => changeSettings({startSoundVariant:e.target.value as Settings['startSoundVariant']})}><option value="bright">{t('Bright gong')}</option><option value="classic">{t('Classic gong')}</option><option value="chime">{t('Bell chime')}</option></select><button className="sound-test" onClick={() => run(() => playStart(settings.startSoundVariant))}>{t('Test start sound')}</button></fieldset><fieldset className="sound-setting"><legend>{t('End-of-match gong')}</legend><label className="sound-choice"><input type="checkbox" checked={settings.endSound} onChange={e => changeSettings({endSound:e.target.checked})}/><span>{t('Play sound when time expires')}</span></label><select className="sound-select" aria-label={t('End-of-match gong')} value={settings.endSoundVariant} onChange={e => changeSettings({endSoundVariant:e.target.value as Settings['endSoundVariant']})}><option value="bright">{t('Bright gong')}</option><option value="classic">{t('Classic gong')}</option><option value="chime">{t('Bell chime')}</option></select><button className="sound-test" onClick={() => run(() => playHorn(settings.endSoundVariant))}>{t('Test end-of-match sound')}</button></fieldset></div><small>{t('Sound settings are saved on this device. Start sound plays on Start, not on Resume.')}</small><button className="wide" onClick={() => { setDialog('display'); run(async () => setMonitorList(await monitors())); }}>{t('Display settings')}</button><div className="settings-author">Никита Иванюшкин</div></>}
      {dialog === 'settings' && <div className="settings-author settings-author--footer">Никита Иванюшкин</div>}
      {dialog === 'display' && <div className="display-settings"><p>{t("Move the spectator window to a monitor, then enable fullscreen.")}</p><div className="display-actions"><button onClick={() => run(openDisplay)}>{t("Open Scoreboard Display")}</button><button onClick={() => run(() => fullscreen(true))}>{t("Toggle display fullscreen")}</button><button onClick={() => run(closeDisplay)}>{t("Close display")}</button></div><label>{t("Available monitors")}<select defaultValue="" onChange={e => run(() => moveDisplay(Number(e.target.value)))}><option value="" disabled>{t("Select a monitor")}</option>{monitorList.map((m,i) => <option key={i} value={i}>{m.name || `Monitor ${i+1}`} · {m.size.width} × {m.size.height}</option>)}</select></label>{!monitorList.length && <small>{t("Monitor selection is available in the desktop application. You can also drag the display window manually.")}</small>}<button className="wide" onClick={() => run(() => fullscreen())}>{t("Toggle control fullscreen")}</button><SpectatorBackgroundPicker value={displayBackgroundDraft.spectatorBackground} image={displayBackgroundDraft.spectatorBackgroundImage} animated={displayBackgroundDraft.spectatorBackgroundAnimated} preset={displayBackgroundDraft.spectatorAnimationPreset} timerBackground={displayBackgroundDraft.spectatorTimerBackground} onChange={spectatorBackground => { const update = { spectatorBackground, spectatorBackgroundAnimated: isAnimatableSpectatorBackground(spectatorBackground) ? displayBackgroundDraft.spectatorBackgroundAnimated : false }; setDisplayBackgroundDraft(current => ({ ...current, ...update })); syncDisplayBackground(update); }} onImageChange={spectatorBackgroundImage => { const update = { spectatorBackgroundImage, ...(spectatorBackgroundImage ? { spectatorBackground: 'custom' as const } : {}) }; setDisplayBackgroundDraft(current => ({ ...current, ...update })); syncDisplayBackground(update); }} onAnimatedChange={spectatorBackgroundAnimated => { const update = { spectatorBackgroundAnimated }; setDisplayBackgroundDraft(current => ({ ...current, ...update })); syncDisplayBackground(update); }} onPresetChange={spectatorAnimationPreset => { const update = { spectatorAnimationPreset }; setDisplayBackgroundDraft(current => ({ ...current, ...update })); syncDisplayBackground(update); }} onTimerBackgroundChange={spectatorTimerBackground => setDisplayBackgroundDraft(current => ({ ...current, spectatorTimerBackground }))}/><div className="dialog-actions display-settings__actions"><button className="primary" onClick={applyDisplayBackground}>{t('Apply')}</button></div></div>}
    </Modal>}
  </div>;
}
