import { useMemo, useState } from 'react';
import { useTranslation } from '../app/i18n';
import { formatTime, parseTime } from '../domain/timer';
import type { AthleteColor } from '../domain/rules';
import type { TournamentDraft } from '../types/tournament';
import { NameInput } from './NameInput';
import { TimeInput } from './TimeInput';
import { Modal } from './Modal';
import randomizeBracketIcon from '../assets/randomize-bracket-icon.png';

type DragSource = { kind: 'pool'; athleteId: number } | { kind: 'slot'; index: number };
type BracketAthlete = { id: number; name: string; duplicateIndex?: number };
const initialCompetitors = () => Array.from({ length: 4 }, () => '');
const nextPowerOfTwo = (value: number) => 2 ** Math.ceil(Math.log2(Math.max(2, value)));
const athleteColors: AthleteColor[] = ['red', 'blue', 'white'];

export function TournamentSetup({ onBack, onStart }: { onBack: () => void; onStart: (draft: TournamentDraft, placements: (number | null)[]) => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [draft, setDraft] = useState<TournamentDraft>({ name: '', matchDuration: 300000, competitors: initialCompetitors(), matchColors: ['red', 'blue'], format: 'single-elimination', ruleset: 'standard' });
  const [time, setTime] = useState(formatTime(300000));
  const [placements, setPlacements] = useState<(number | null)[]>([]);
  const [dragged, setDragged] = useState<DragSource | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [overPool, setOverPool] = useState(false);
  const [allowRepeatedAthletes, setAllowRepeatedAthletes] = useState(false);
  const [highlightEmptyAthletes, setHighlightEmptyAthletes] = useState(false);
  const [confirmIncompleteBracket, setConfirmIncompleteBracket] = useState(false);
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
  const beginDrag = (source: DragSource) => {
    setDragged(source);
    setDropIndex(null);
    setOverPool(false);
  };

  const toAthletes = () => {
    if (!duration || !draft.name.trim()) return;
    setDraft(current => ({ ...current, matchDuration: duration }));
    setStep(2);
  };
  const openBracket = () => {
    if (competitors.length < 2) return;
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
  const place = (index: number) => {
    if (!dragged) return;
    setPlacements(current => {
      const next = [...current];
      const incoming = dragged.kind === 'pool' ? dragged.athleteId : next[dragged.index];
      if (incoming === null) return current;
      if (dragged.kind === 'slot') next[dragged.index] = next[index] ?? null;
      next[index] = incoming;
      return next;
    });
    setDragged(null);
    setDropIndex(null);
    setOverPool(false);
  };
  const returnToPool = () => {
    if (!dragged || dragged.kind !== 'slot') return;
    setPlacements(current => current.map((athleteId, index) => index === dragged.index ? null : athleteId));
    setDragged(null);
    setDropIndex(null);
    setOverPool(false);
  };
  const randomize = () => {
    const shuffled = competitors.map(athlete => athlete.id);
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
    }
    setPlacements(Array.from({ length: bracketSize }, (_, index) => shuffled[index] ?? null));
  };
  const resetBracket = () => {
    setPlacements(Array.from({ length: bracketSize }, () => null));
    setDragged(null);
    setDropIndex(null);
    setOverPool(false);
  };
  const addMatch = () => setPlacements(current => [...current, null, null]);

  return <main className={`tournament-setup ${step === 3 ? 'bracket-editor' : ''}`} aria-labelledby="tournament-heading">
    <div className="wizard-head">
      <button className="back-button" onClick={step === 1 ? onBack : () => setStep((step - 1) as 1 | 2)}><span aria-hidden="true">←</span> {t('Back')}</button>
      <div><div className="eyebrow">{t('TOURNAMENT')}</div><h1 id="tournament-heading">{t(step === 1 ? 'Tournament details' : step === 2 ? 'Tournament athletes' : 'Tournament bracket')}</h1></div>
      <div className="wizard-steps" aria-label={t('Tournament progress')}><span className={step >= 1 ? 'active' : ''}>1</span><span className={step >= 2 ? 'active' : ''}>2</span><span className={step >= 3 ? 'active' : ''}>3</span></div>
    </div>

    {step === 1 && <form className="wizard-card tournament-details" onSubmit={event => { event.preventDefault(); toAthletes(); }}>
      <label>{t('Tournament name')}<input autoFocus required maxLength={100} value={draft.name} onChange={event => setDraft(current => ({ ...current, name: event.target.value }))} placeholder={t('Tournament name')}/></label>
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
      {!duration && <p className="validation">{t('Enter a duration from 00:01 to 99:59.')}</p>}
      <p className="future-note">{t('Olympic rules and round-robin formats are planned for a later release.')}</p>
      <button className="primary wizard-next" disabled={!duration || !draft.name.trim()}>{t('Continue')} <span aria-hidden="true">→</span></button>
    </form>}

    {step === 2 && <section className="wizard-card athlete-step">
      <p>{t('Add at least two athletes. Names are formatted consistently as you type.')}</p>
      <div className="tournament-athletes">{draft.competitors.map((name, index) => <label key={index}>{t('Athlete')} {index + 1}<NameInput aria-label={`${t('Athlete')} ${index + 1}`} aria-invalid={highlightEmptyAthletes && !name.trim()} className={highlightEmptyAthletes && !name.trim() ? 'athlete-name-missing' : undefined} maxLength={60} placeholder={t('Athlete name')} value={name} onChange={value => setDraft(current => ({ ...current, competitors: current.competitors.map((item, itemIndex) => itemIndex === index ? value : item) }))}/></label>)}</div>
      <div className="wizard-actions"><div className="athlete-actions"><button type="button" onClick={() => setDraft(current => ({ ...current, competitors: [...current.competitors, ''] }))}>{t('Add athlete')}</button><button type="button" disabled={draft.competitors.length <= 2} onClick={() => setDraft(current => ({ ...current, competitors: current.competitors.slice(0, -1) }))}>{t('Remove athlete')}</button></div><button className="primary" disabled={competitors.length < 2} onClick={toBracket}>{t('Create bracket')} <span aria-hidden="true">→</span></button></div>
    </section>}

    {confirmIncompleteBracket && <Modal title="Incomplete athletes" close={() => setConfirmIncompleteBracket(false)}><p>{t('Some athlete fields are empty. Create the bracket with the filled-in athletes only?')}</p><div className="dialog-actions"><button onClick={() => setConfirmIncompleteBracket(false)}>{t('Keep editing')}</button><button className="primary" onClick={() => { setConfirmIncompleteBracket(false); openBracket(); }}>{t('Create bracket anyway')}</button></div></Modal>}

    {step === 3 && <section className="bracket-stage">
      <div className="bracket-toolbar"><div><strong>{draft.name}</strong><small>{formatTime(draft.matchDuration)} · {competitors.length} {t('athletes')}</small></div><div className="bracket-actions"><button className="dice-button" onClick={randomize} aria-label={t('Randomize bracket')} title={t('Randomize bracket')}><img src={randomizeBracketIcon} alt="" /></button><button className="reset-bracket" onClick={resetBracket}>{t('Reset bracket')}</button></div></div>
      <p className="bracket-help">{t('Drag athletes into the first-round slots. Random distribution can still be adjusted manually.')}</p>
      <div className="bracket-layout">
        <aside className={`athlete-pool ${overPool ? 'drop-target' : ''}`} aria-label={t('Athlete pool')} onDragEnter={() => dragged?.kind === 'slot' && setOverPool(true)} onDragLeave={event => { if (event.currentTarget === event.target) setOverPool(false); }} onDragOver={event => event.preventDefault()} onDrop={returnToPool}>
          <h2>{t('Athletes')}</h2><label className="repeat-athletes"><input type="checkbox" checked={allowRepeatedAthletes} onChange={event => setAllowRepeatedAthletes(event.target.checked)}/><span>{t('Use athletes more than once')}</span></label>
          {(allowRepeatedAthletes ? competitors : competitors.filter(athlete => !placements.includes(athlete.id))).map(athlete => <button draggable key={athlete.id} className="pool-athlete" onDragStart={() => beginDrag({ kind: 'pool', athleteId: athlete.id })} onDragEnd={() => { setDragged(null); setDropIndex(null); setOverPool(false); }}>{athlete.name}{athlete.duplicateIndex && <sup className="duplicate-marker">{athlete.duplicateIndex}</sup>}</button>)}
        </aside>
        <div className="bracket-round first-round">
          <div className="round-title"><h2>{t('Round 1')}</h2><button type="button" className="add-bracket-match" onClick={addMatch}>{t('Add match')}</button></div>
          <div className="bracket-pairs">{firstRoundMatches.map(([firstIndex, secondIndex], matchIndex) => <section className="bracket-match" key={firstIndex} aria-label={`${t('Round 1')} ${matchIndex + 1}`}>
            <span className="bracket-match-label">{t('Match')} {matchIndex + 1}</span>
            {[firstIndex, secondIndex].map(index => {
              const athlete = athletesById.get(placements[index] ?? -1);
              const color = draft.matchColors[index % 2];
              const isDropTarget = dropIndex === index && !!dragged;
              return <button draggable={!!athlete} key={index} className={`bracket-slot ${athlete ? 'filled' : ''} slot-${color} ${isDropTarget ? `drop-${color}` : ''}`} onDragStart={() => athlete && beginDrag({ kind: 'slot', index })} onDragEnd={() => { setDragged(null); setDropIndex(null); setOverPool(false); }} onDragEnter={() => dragged && setDropIndex(index)} onDragLeave={event => { if (event.currentTarget === event.target) setDropIndex(null); }} onDragOver={event => event.preventDefault()} onDrop={() => place(index)}>{athlete ? <>{athlete.name}{athlete.duplicateIndex && <sup className="duplicate-marker">{athlete.duplicateIndex}</sup>}</> : <span>{t('Drop athlete here')}</span>}</button>;
            })}
          </section>)}</div>
        </div>
      </div>
      <button className="primary start-tournament" onClick={() => onStart(draft, placements)}>{t('Start tournament')}</button>
    </section>}
  </main>;
}
