import { useMemo, useState } from 'react';
import { useTranslation } from '../app/i18n';
import { formatTime, parseTime } from '../domain/timer';
import type { TournamentDraft } from '../types/tournament';
import { NameInput } from './NameInput';
import { TimeInput } from './TimeInput';

type DragSource = { kind: 'pool'; name: string } | { kind: 'slot'; index: number };
const emptyNames = () => Array.from({ length: 8 }, () => '');
const nextPowerOfTwo = (value: number) => 2 ** Math.ceil(Math.log2(Math.max(2, value)));

export function TournamentSetup({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [draft, setDraft] = useState<TournamentDraft>({ name: '', matchDuration: 300000, competitors: emptyNames(), format: 'single-elimination', ruleset: 'standard' });
  const [time, setTime] = useState(formatTime(300000));
  const [placements, setPlacements] = useState<(string | null)[]>([]);
  const [dragged, setDragged] = useState<DragSource | null>(null);
  const duration = parseTime(time);
  const competitors = useMemo(() => draft.competitors.map(name => name.trim()).filter(Boolean), [draft.competitors]);
  const bracketSize = nextPowerOfTwo(competitors.length);

  const toAthletes = () => {
    if (!duration || !draft.name.trim()) return;
    setDraft(current => ({ ...current, matchDuration: duration }));
    setStep(2);
  };
  const toBracket = () => {
    if (competitors.length < 2) return;
    setPlacements(current => current.length === bracketSize ? current : Array.from({ length: bracketSize }, (_, index) => current[index] ?? null));
    setStep(3);
  };
  const place = (index: number) => {
    if (!dragged) return;
    setPlacements(current => {
      const next = [...current];
      const incoming = dragged.kind === 'pool' ? dragged.name : next[dragged.index];
      if (!incoming) return current;
      if (dragged.kind === 'slot') next[dragged.index] = next[index] ?? null;
      next[index] = incoming;
      return next;
    });
    setDragged(null);
  };
  const randomize = () => {
    const shuffled = [...competitors];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
    }
    setPlacements(Array.from({ length: bracketSize }, (_, index) => shuffled[index] ?? null));
  };

  return <main className="tournament-setup" aria-labelledby="tournament-heading">
    <div className="wizard-head">
      <button className="back-button" onClick={step === 1 ? onBack : () => setStep((step - 1) as 1 | 2)}>{t('← Back')}</button>
      <div><div className="eyebrow">{t('TOURNAMENT')}</div><h1 id="tournament-heading">{t(step === 1 ? 'Tournament details' : step === 2 ? 'Tournament athletes' : 'Tournament bracket')}</h1></div>
      <div className="wizard-steps" aria-label={t('Tournament progress')}><span className={step >= 1 ? 'active' : ''}>1</span><span className={step >= 2 ? 'active' : ''}>2</span><span className={step >= 3 ? 'active' : ''}>3</span></div>
    </div>

    {step === 1 && <form className="wizard-card tournament-details" onSubmit={event => { event.preventDefault(); toAthletes(); }}>
      <label>{t('Tournament name')}<input autoFocus required maxLength={100} value={draft.name} onChange={event => setDraft(current => ({ ...current, name: event.target.value }))} placeholder={t('Tournament name')}/></label>
      <label>{t('Time per match')}<TimeInput label={t('Time per match')} value={time} onChange={setTime}/></label>
      {!duration && <p className="validation">{t('Enter a duration from 00:01 to 999:59.')}</p>}
      <p className="future-note">{t('Olympic rules and round-robin formats are planned for a later release.')}</p>
      <button className="primary wizard-next" disabled={!duration || !draft.name.trim()}>{t('Continue')} <span aria-hidden="true">→</span></button>
    </form>}

    {step === 2 && <section className="wizard-card athlete-step">
      <p>{t('Add at least two athletes. Names are formatted consistently as you type.')}</p>
      <div className="tournament-athletes">{draft.competitors.map((name, index) => <label key={index}>{t('Athlete')} {index + 1}<NameInput aria-label={`${t('Athlete')} ${index + 1}`} maxLength={60} placeholder={t('Athlete name')} value={name} onChange={value => setDraft(current => ({ ...current, competitors: current.competitors.map((item, itemIndex) => itemIndex === index ? value : item) }))}/></label>)}</div>
      <div className="wizard-actions"><button type="button" onClick={() => setDraft(current => ({ ...current, competitors: [...current.competitors, ''] }))}>{t('Add athlete')}</button><button className="primary" disabled={competitors.length < 2} onClick={toBracket}>{t('Create bracket')} <span aria-hidden="true">→</span></button></div>
    </section>}

    {step === 3 && <section className="bracket-stage">
      <div className="bracket-toolbar"><div><strong>{draft.name}</strong><small>{formatTime(draft.matchDuration)} · {competitors.length} {t('athletes')}</small></div><button className="dice-button" onClick={randomize} aria-label={t('Randomize bracket')} title={t('Randomize bracket')}>⬡</button></div>
      <p className="bracket-help">{t('Drag athletes into the first-round slots. Random distribution can still be adjusted manually.')}</p>
      <div className="bracket-layout">
        <aside className="athlete-pool" aria-label={t('Athlete pool')}><h2>{t('Athletes')}</h2>{competitors.filter(name => !placements.includes(name)).map((name, index) => <button draggable key={`${name}-${index}`} className="pool-athlete" onDragStart={() => setDragged({ kind: 'pool', name })}>{name}</button>)}</aside>
        <div className="bracket-round"><h2>{t('Round 1')}</h2><div className="bracket-slots">{placements.map((name, index) => <div key={index} className="bracket-match"><button draggable={!!name} className={`bracket-slot ${name ? 'filled' : ''}`} onDragStart={() => name && setDragged({ kind: 'slot', index })} onDragOver={event => event.preventDefault()} onDrop={() => place(index)}>{name ?? <span>{t('Drop athlete here')}</span>}</button>{index % 2 === 1 && <span className="bracket-link" aria-hidden="true"/>}</div>)}</div></div>
        <div className="bracket-round future-round"><h2>{t('Next rounds')}</h2>{Array.from({ length: Math.max(1, bracketSize / 2) }, (_, index) => <div className="bracket-slot pending" key={index}>{t('Winner')}</div>)}</div>
      </div>
      <p className="future-note">{t('Starting the tournament and recording results will be added next.')}</p>
    </section>}
  </main>;
}
