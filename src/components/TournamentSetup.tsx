import { useMemo, useRef, useState, type DragEvent } from 'react';
import { useTranslation } from '../app/i18n';
import { formatTime, parseTime } from '../domain/timer';
import type { AthleteColor } from '../domain/rules';
import { isAnimatableSpectatorBackground, normalizeSpectatorAnimationPreset, normalizeSpectatorBackground, normalizeSpectatorBackgroundImage, type TournamentDraft, type TournamentState } from '../types/tournament';
import { useSettingsStore } from '../stores/settingsStore';
import { NameInput } from './NameInput';
import { TimeInput } from './TimeInput';
import { Modal } from './Modal';
import { SpectatorBackgroundPicker } from './SpectatorBackground';
import { roundRobinRounds } from './TournamentBracket';
import randomizeBracketIcon from '../assets/randomize-bracket-icon.png';

type DragSource = { kind: 'pool'; athleteId: number } | { kind: 'slot'; index: number };
type BracketAthlete = { id: number; name: string; duplicateIndex?: number };
type TournamentBranding = Pick<TournamentDraft, 'logo' | 'spectatorBackground' | 'spectatorBackgroundImage' | 'spectatorBackgroundAnimated' | 'spectatorAnimationPreset' | 'spectatorTimerBackground'>;
const initialCompetitors = () => Array.from({ length: 4 }, () => '');
const nextPowerOfTwo = (value: number) => 2 ** Math.ceil(Math.log2(Math.max(2, value)));
const athleteColors: AthleteColor[] = ['red', 'blue', 'white'];
const dragSourceMime = 'application/x-tatami-athlete';

export function TournamentSetup({ onBack, onStart, tournament }: { onBack: () => void; onStart: (draft: TournamentDraft, placements: (number | null)[]) => void; tournament?: TournamentState | null }) {
  const { t } = useTranslation();
  const defaultSpectatorSettings = useSettingsStore(state => state.settings);
  const [step, setStep] = useState<1 | 2 | 3>(tournament ? tournament.draft.format === 'single-elimination' ? 3 : 2 : 1);
  const [draft, setDraft] = useState<TournamentDraft>(() => {
    const spectatorBackground = normalizeSpectatorBackground(tournament?.draft.spectatorBackground ?? defaultSpectatorSettings.spectatorBackground);
    return tournament ? { ...structuredClone(tournament.draft), logo: tournament.draft.logo ?? null, spectatorBackground, spectatorBackgroundImage: normalizeSpectatorBackgroundImage(tournament.draft.spectatorBackgroundImage), spectatorBackgroundAnimated: isAnimatableSpectatorBackground(spectatorBackground) && tournament.draft.spectatorBackgroundAnimated === true, spectatorAnimationPreset: normalizeSpectatorAnimationPreset(tournament.draft.spectatorAnimationPreset), spectatorTimerBackground: typeof tournament.draft.spectatorTimerBackground === 'boolean' ? tournament.draft.spectatorTimerBackground : true } : { name: '', logo: defaultSpectatorSettings.spectatorLogo, spectatorBackground, spectatorBackgroundImage: defaultSpectatorSettings.spectatorBackgroundImage, spectatorBackgroundAnimated: isAnimatableSpectatorBackground(spectatorBackground) && defaultSpectatorSettings.spectatorBackgroundAnimated, spectatorAnimationPreset: defaultSpectatorSettings.spectatorAnimationPreset, spectatorTimerBackground: defaultSpectatorSettings.spectatorTimerBackground, matchDuration: 300000, competitors: initialCompetitors(), matchColors: ['red', 'blue'], format: 'single-elimination', ruleset: 'olympic' };
  });
  const [logoError, setLogoError] = useState<string | null>(null);
  const [branding, setBranding] = useState<TournamentBranding | null>(null);
  const [time, setTime] = useState(() => formatTime(tournament?.draft.matchDuration ?? 300000));
  const [placements, setPlacements] = useState<(number | null)[]>(() => tournament ? [...tournament.seeds] : []);
  const [dragged, setDragged] = useState<DragSource | null>(null);
  const draggedRef = useRef<DragSource | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [overPool, setOverPool] = useState(false);
  const [allowRepeatedAthletes, setAllowRepeatedAthletes] = useState(false);
  const [highlightEmptyAthletes, setHighlightEmptyAthletes] = useState(false);
  const [confirmIncompleteBracket, setConfirmIncompleteBracket] = useState(false);
  const isRoundRobin = draft.format === 'round-robin';
  const isFreeTournament = draft.format === 'free';
  const duration = parseTime(time);
  const competitors = useMemo<BracketAthlete[]>(() => {
    const names = draft.competitors.map(name => name.trim());
    const totals = new Map<string, number>();
    names.filter(Boolean).forEach(name => totals.set(name, (totals.get(name) ?? 0) + 1));
    const seen = new Map<string, number>();
    return names.flatMap((name, id) => {
      if (!name) return [];
      const duplicateIndex = (seen.get(name) ?? 0) + 1;
      seen.set(name, duplicateIndex);
      return [{ id, name, duplicateIndex: totals.get(name)! > 1 ? duplicateIndex : undefined }];
    });
  }, [draft.competitors]);
  const athletesById = useMemo(() => new Map(competitors.map(athlete => [athlete.id, athlete])), [competitors]);
  const lockedSlotIndexes = useMemo(() => {
    if (!tournament) return new Set<number>();
    if (tournament.draft.format === 'round-robin') {
      const lockedAthletes = new Set(roundRobinRounds(tournament).flat().filter(match => match.winnerId !== null).flatMap(match => [match.athleteA, match.athleteB]));
      return new Set(placements.flatMap((athleteId, index) => athleteId !== null && lockedAthletes.has(athleteId) ? [index] : []));
    }
    return new Set(Object.keys(tournament.results).flatMap(matchId => {
      const match = /^round-0-match-(\d+)$/.exec(matchId);
      return match ? [Number(match[1]) * 2, Number(match[1]) * 2 + 1] : [];
    }));
  }, [placements, tournament]);
  const lockedAthleteIds = useMemo(() => new Set([...lockedSlotIndexes].map(index => placements[index]).filter((id): id is number => id !== null)), [lockedSlotIndexes, placements]);
  const requiredBracketSize = nextPowerOfTwo(competitors.length);
  const bracketSize = Math.max(requiredBracketSize, placements.length);
  const firstRoundMatches = Array.from({ length: bracketSize / 2 }, (_, index) => [index * 2, index * 2 + 1] as const);
  const setMatchColor = (index: 0 | 1, color: AthleteColor) => setDraft(current => {
    const matchColors = [...current.matchColors] as [AthleteColor, AthleteColor];
    const previous = matchColors[index];
    matchColors[index] = color;
    if (matchColors[1 - index] === color) matchColors[1 - index] = previous;
    return { ...current, matchColors };
  });
  const clearDrag = () => {
    draggedRef.current = null;
    setDragged(null);
    setDropIndex(null);
    setOverPool(false);
  };
  const beginDrag = (source: DragSource, event?: DragEvent<HTMLElement>) => {
    if (event) {
      const serialized = JSON.stringify(source);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData(dragSourceMime, serialized);
      event.dataTransfer.setData('text/plain', serialized);
    }
    draggedRef.current = source;
    setDragged(source);
    setDropIndex(null);
    setOverPool(false);
  };
  const sourceFromEvent = (event: DragEvent<HTMLElement>): DragSource | null => {
    try {
      const raw = event.dataTransfer.getData(dragSourceMime) || event.dataTransfer.getData('text/plain');
      const source: unknown = JSON.parse(raw);
      if (typeof source !== 'object' || source === null || !('kind' in source)) return null;
      if (source.kind === 'pool' && 'athleteId' in source && typeof source.athleteId === 'number') return { kind: 'pool', athleteId: source.athleteId };
      if (source.kind === 'slot' && 'index' in source && typeof source.index === 'number') return { kind: 'slot', index: source.index };
    } catch {
      // The click-to-place fallback remains available when a browser blocks drag data.
    }
    return null;
  };

  const toAthletes = () => {
    if (!duration) return;
    setDraft(current => ({ ...current, matchDuration: duration }));
    setStep(2);
  };
  const uploadLogo = (file?: File) => {
    setLogoError(null);
    if (!file) return;
    if (file.type !== 'image/png') {
      setLogoError(t('Logo must be a PNG image.'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError(t('The logo must be 2 MB or smaller.'));
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const logo = reader.result;
      if (typeof logo === 'string') setBranding(current => current ? { ...current, logo } : current);
    });
    reader.readAsDataURL(file);
  };
  const openBracket = () => {
    if (competitors.length < 2) return;
    useSettingsStore.getState().update({ spectatorLogo: draft.logo, spectatorBackground: draft.spectatorBackground, spectatorBackgroundImage: draft.spectatorBackgroundImage ?? null, spectatorBackgroundAnimated: draft.spectatorBackgroundAnimated ?? false, spectatorAnimationPreset: draft.spectatorAnimationPreset ?? 'arena-dust', spectatorTimerBackground: draft.spectatorTimerBackground ?? true });
    if (isRoundRobin || isFreeTournament) {
      onStart(draft, competitors.map(athlete => athlete.id));
      return;
    }
    setPlacements(current => current.length >= requiredBracketSize ? current : Array.from({ length: requiredBracketSize }, (_, index) => current[index] ?? null));
    setStep(3);
  };
  const toBracket = () => {
    if (competitors.length < 2) return;
    if (draft.competitors.some(name => !name.trim())) {
      setHighlightEmptyAthletes(true);
      setConfirmIncompleteBracket(true);
      return;
    }
    openBracket();
  };
  const place = (index: number, source = draggedRef.current) => {
    if (!source) return;
    if (lockedSlotIndexes.has(index) || (source.kind === 'slot' && lockedSlotIndexes.has(source.index))) return;
    setPlacements(current => {
      const next = [...current];
      const incoming = source.kind === 'pool' ? source.athleteId : next[source.index];
      if (incoming === null) return current;
      if (source.kind === 'slot') next[source.index] = next[index] ?? null;
      next[index] = incoming;
      return next;
    });
    clearDrag();
  };
  const returnToPool = (source = draggedRef.current) => {
    if (!source || source.kind !== 'slot') return;
    if (lockedSlotIndexes.has(source.index)) return;
    setPlacements(current => current.map((athleteId, index) => index === source.index ? null : athleteId));
    clearDrag();
  };
  const randomize = () => {
    const shuffled = competitors.filter(athlete => !lockedAthleteIds.has(athlete.id)).map(athlete => athlete.id);
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
    }
    setPlacements(current => {
      const next = Array.from({ length: bracketSize }, () => null as number | null);
      [...lockedSlotIndexes].forEach(index => { next[index] = current[index] ?? null; });
      Array.from({ length: bracketSize }, (_, index) => index).filter(index => !lockedSlotIndexes.has(index)).forEach((index, shuffledIndex) => { next[index] = shuffled[shuffledIndex] ?? null; });
      return next;
    });
  };
  const resetBracket = () => {
    setPlacements(current => Array.from({ length: bracketSize }, (_, index) => lockedSlotIndexes.has(index) ? current[index] ?? null : null));
    clearDrag();
  };
  const addMatch = () => setPlacements(current => [...current, null, null]);

  return <main className={`tournament-setup ${step === 3 ? 'bracket-editor' : ''}`} aria-labelledby="tournament-heading">
    <div className="wizard-head">
      {step === 3 && <button className="back-button" onClick={tournament ? onBack : () => setStep(2)}><span aria-hidden="true">←</span> {t('Back')}</button>}
      <div><div className="eyebrow">{t('TOURNAMENT')}</div><h1 id="tournament-heading">{t(step === 1 ? 'Tournament details' : step === 2 ? 'Tournament athletes' : 'Tournament bracket')}</h1></div>
      <div className="wizard-steps" aria-label={t('Tournament progress')}><span className={step >= 1 ? 'active' : ''}>1</span><span className={step >= 2 ? 'active' : ''}>2</span>{!isFreeTournament && <span className={step >= 3 ? 'active' : ''}>3</span>}</div>
    </div>

    {step === 1 && <form className="wizard-card tournament-details" onSubmit={event => { event.preventDefault(); toAthletes(); }}>
      <label>{t('Tournament name')}<input autoFocus maxLength={100} value={draft.name} onChange={event => setDraft(current => ({ ...current, name: event.target.value }))} placeholder={t('Tournament name')}/></label>
      <button className="tournament-branding-button" type="button" onClick={() => { setLogoError(null); setBranding({ logo: draft.logo, spectatorBackground: draft.spectatorBackground, spectatorBackgroundImage: draft.spectatorBackgroundImage ?? null, spectatorBackgroundAnimated: draft.spectatorBackgroundAnimated ?? false, spectatorAnimationPreset: draft.spectatorAnimationPreset ?? 'arena-dust', spectatorTimerBackground: draft.spectatorTimerBackground ?? true }); }}>{t('Spectator window appearance')}</button>
      {branding && <Modal title="Spectator window appearance" close={() => { setLogoError(null); setBranding(null); }}>
        <div className="tournament-branding-dialog">
          <label className="tournament-logo-control">
            {t('Tournament logo (PNG)')}
            <input type="file" accept="image/png" onChange={event => uploadLogo(event.currentTarget.files?.[0])}/>
            <span className="tournament-logo-control__hint">{t('Upload a transparent PNG up to 2 MB.')}</span>
            {logoError && <span className="tournament-logo-control__error" role="alert">{logoError}</span>}
          </label>
          {branding.logo && <div className="tournament-logo-preview">
            <img src={branding.logo} alt={t('Tournament logo')}/>
            <button type="button" onClick={() => { setBranding(current => current ? { ...current, logo: null } : current); setLogoError(null); }}>{t('Remove logo')}</button>
          </div>}
          <SpectatorBackgroundPicker value={branding.spectatorBackground} image={branding.spectatorBackgroundImage} animated={branding.spectatorBackgroundAnimated} preset={branding.spectatorAnimationPreset} timerBackground={branding.spectatorTimerBackground} onChange={spectatorBackground => { const update = { spectatorBackground, spectatorBackgroundAnimated: isAnimatableSpectatorBackground(spectatorBackground) ? branding.spectatorBackgroundAnimated : false }; setBranding(current => current ? { ...current, ...update } : current); setDraft(current => ({ ...current, ...update })); }} onImageChange={spectatorBackgroundImage => { const update = { spectatorBackgroundImage, ...(spectatorBackgroundImage ? { spectatorBackground: 'custom' as const } : {}) }; setBranding(current => current ? { ...current, ...update } : current); setDraft(current => ({ ...current, ...update })); }} onAnimatedChange={spectatorBackgroundAnimated => setBranding(current => current ? { ...current, spectatorBackgroundAnimated } : current)} onPresetChange={spectatorAnimationPreset => setBranding(current => current ? { ...current, spectatorAnimationPreset } : current)} onTimerBackgroundChange={spectatorTimerBackground => setBranding(current => current ? { ...current, spectatorTimerBackground } : current)}/>
          <div className="dialog-actions tournament-branding-dialog__actions">
            <button type="button" className="primary" onClick={() => { setDraft(current => ({ ...current, ...branding })); setLogoError(null); setBranding(null); }}>{t('Apply')}</button>
          </div>
        </div>
      </Modal>}
      <label>{t('Time per match')}<TimeInput label={t('Time per match')} value={time} onChange={setTime}/></label>
      <fieldset className="tournament-colors">
        <legend>{t('Match colors')}</legend>
        {([0, 1] as const).map(index => <label key={index} className={`color-select color-${draft.matchColors[index]}`}>
          {t(index === 0 ? 'First position' : 'Second position')}
          <select value={draft.matchColors[index]} onChange={event => setMatchColor(index, event.target.value as AthleteColor)}>
            {athleteColors.map(color => <option key={color} value={color}>{t(color.toUpperCase())}</option>)}
          </select>
        </label>)}
      </fieldset>
      <fieldset className="tournament-format">
        <legend>{t('Tournament format')}</legend>
        <label><input type="radio" name="tournament-format" checked={draft.format === 'single-elimination'} onChange={() => setDraft(current => ({ ...current, format: 'single-elimination' }))}/><span>{t('Olympic system')}</span><small>{t('The loser is eliminated from the tournament.')}</small></label>
        <label><input type="radio" name="tournament-format" checked={isRoundRobin} onChange={() => setDraft(current => ({ ...current, format: 'round-robin' }))}/><span>{t('Round robin')}</span><small>{t('Each athlete meets every other athlete once.')}</small></label>
        <label><input type="radio" name="tournament-format" checked={isFreeTournament} onChange={() => setDraft(current => ({ ...current, format: 'free' }))}/><span>{t('Free tournament')}</span><small>{t('Create any match from the participant list and keep a live leaderboard.')}</small></label>
      </fieldset>
      {!duration && <p className="validation">{t('Enter a duration from 00:01 to 99:59.')}</p>}
      <button className="primary wizard-next" disabled={!duration}>{t('Continue')}</button>
      <button className="back-button wizard-back" type="button" onClick={onBack}>{t('Back')}</button>
    </form>}

    {step === 2 && <section className="wizard-card athlete-step">
      <p>{t('Add at least two athletes. Names are formatted consistently as you type.')}</p>
      <div className="tournament-athletes">{draft.competitors.map((name, index) => <label key={index}>{t('Athlete')} {index + 1}<NameInput aria-label={`${t('Athlete')} ${index + 1}`} aria-invalid={highlightEmptyAthletes && !name.trim()} className={highlightEmptyAthletes && !name.trim() ? 'athlete-name-missing' : undefined} maxLength={60} placeholder={t('Athlete name')} value={name} onChange={value => setDraft(current => ({ ...current, competitors: current.competitors.map((item, itemIndex) => itemIndex === index ? value : item) }))}/></label>)}</div>
      <div className="wizard-actions"><div className="athlete-actions"><button type="button" onClick={() => setDraft(current => ({ ...current, competitors: [...current.competitors, ''] }))}>{t('Add athlete')}</button><button type="button" disabled={draft.competitors.length <= 2} onClick={() => setDraft(current => ({ ...current, competitors: current.competitors.slice(0, -1) }))}>{t('Remove athlete')}</button></div><div className="wizard-navigation"><button className="primary" disabled={competitors.length < 2} onClick={toBracket}>{t(isRoundRobin || isFreeTournament ? 'Start tournament' : 'Create bracket')}</button><button className="back-button wizard-back" type="button" onClick={tournament ? onBack : () => setStep(1)}>{t('Back')}</button></div></div>
    </section>}

    {confirmIncompleteBracket && <Modal title="Incomplete athletes" close={() => setConfirmIncompleteBracket(false)}><p>{t('Some athlete fields are empty. Create the bracket with the filled-in athletes only?')}</p><div className="dialog-actions"><button onClick={() => setConfirmIncompleteBracket(false)}>{t('Keep editing')}</button><button className="primary" onClick={() => { setConfirmIncompleteBracket(false); openBracket(); }}>{t('Create bracket anyway')}</button></div></Modal>}

    {step === 3 && <section className="bracket-stage">
      <div className="bracket-toolbar"><div><strong>{draft.name}</strong><small>{formatTime(draft.matchDuration)} · {competitors.length} {t('athletes')}</small></div><div className="bracket-actions"><button className="dice-button" onClick={randomize} aria-label={t('Randomize bracket')} title={t('Randomize bracket')}><img src={randomizeBracketIcon} alt="" /></button><button className="reset-bracket" onClick={resetBracket}>{t('Reset bracket')}</button></div></div>
      <p className="bracket-help">{t(isRoundRobin ? 'Select the athletes for the round-robin schedule. Each pair will meet once.' : 'Drag athletes into the first-round slots, or click an athlete and then a slot. Random distribution can still be adjusted manually.')}{tournament && <><br/>{t('Completed matches are locked. Unplayed matches can still be edited.')}</>}</p>
      <div className="bracket-layout">
        <aside className={`athlete-pool ${overPool ? 'drop-target' : ''}`} aria-label={t('Athlete pool')} onDragEnter={() => draggedRef.current?.kind === 'slot' && setOverPool(true)} onDragLeave={event => { if (event.currentTarget === event.target) setOverPool(false); }} onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }} onDrop={event => { event.preventDefault(); returnToPool(draggedRef.current ?? sourceFromEvent(event)); }}>
          <h2>{t('Athletes')}</h2><label className="repeat-athletes"><input type="checkbox" checked={allowRepeatedAthletes} onChange={event => setAllowRepeatedAthletes(event.target.checked)}/><span>{t('Multi-select athlete')}</span></label>
          {(allowRepeatedAthletes ? competitors : competitors.filter(athlete => !placements.includes(athlete.id))).filter(athlete => !lockedAthleteIds.has(athlete.id)).map(athlete => <button draggable key={athlete.id} className={`pool-athlete ${dragged?.kind === 'pool' && dragged.athleteId === athlete.id ? 'drag-selected' : ''}`} onClick={() => beginDrag({ kind: 'pool', athleteId: athlete.id })} onDragStart={event => beginDrag({ kind: 'pool', athleteId: athlete.id }, event)} onDragEnd={clearDrag}>{athlete.name}{athlete.duplicateIndex && <sup className="duplicate-marker">{athlete.duplicateIndex}</sup>}</button>)}
        </aside>
        <div className="bracket-round first-round">
          <div className="round-title"><h2>{t(isRoundRobin ? 'Round-robin athletes' : 'Round 1')}</h2>{!isRoundRobin && <button type="button" className="add-bracket-match" onClick={addMatch}>{t('Add match')}</button>}</div>
          <div className="bracket-pairs">{firstRoundMatches.map(([firstIndex, secondIndex], matchIndex) => <section className="bracket-match" key={firstIndex} aria-label={`${t(isRoundRobin ? 'Round-robin athletes' : 'Round 1')} ${matchIndex + 1}`}>
            <span className="bracket-match-label">{isRoundRobin ? `${t('Athlete')} ${firstIndex + 1}` : `${t('Match')} ${matchIndex + 1}`}</span>
            {[firstIndex, secondIndex].map(index => {
              const athlete = athletesById.get(placements[index] ?? -1);
              const color = draft.matchColors[index % 2];
              const locked = lockedSlotIndexes.has(index);
              const isDropTarget = !locked && dropIndex === index && !!draggedRef.current;
              return <button draggable={!!athlete && !locked} key={index} aria-disabled={locked} className={`bracket-slot ${athlete ? 'filled' : ''} ${locked ? 'locked' : ''} slot-${color} ${isDropTarget ? `drop-${color}` : ''} ${dragged?.kind === 'slot' && dragged.index === index ? 'drag-selected' : ''}`} onClick={() => { if (locked) return; if (draggedRef.current) place(index); else if (athlete) beginDrag({ kind: 'slot', index }); }} onDragStart={event => athlete && !locked && beginDrag({ kind: 'slot', index }, event)} onDragEnd={clearDrag} onDragEnter={event => { event.preventDefault(); if (!locked && draggedRef.current) setDropIndex(index); }} onDragLeave={event => { if (event.currentTarget === event.target) setDropIndex(null); }} onDragOver={event => { if (!locked) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } }} onDrop={event => { event.preventDefault(); if (!locked) place(index, draggedRef.current ?? sourceFromEvent(event)); }}>{athlete ? <>{athlete.name}{athlete.duplicateIndex && <sup className="duplicate-marker">{athlete.duplicateIndex}</sup>}</> : <span className="bracket-slot-label">{t('Drop athlete here')}</span>}</button>;
            })}
          </section>)}</div>
        </div>
      </div>
      <button className="primary start-tournament" onClick={() => onStart(draft, placements)}>{t(tournament ? 'Save bracket' : 'Start tournament')}</button>
    </section>}
  </main>;
}
