import { useTranslation } from '../app/i18n';

export function ModeSelection({ onSingleMatch, onTournament }: { onSingleMatch: () => void; onTournament: () => void }) {
  const { t } = useTranslation();
  return <main className="mode-selection" aria-labelledby="mode-heading">
    <div className="mode-selection-copy">
      <div className="eyebrow">{t('TATAMI CONTROL')}</div>
      <h1 id="mode-heading">{t('Choose a mode')}</h1>
      <p>{t('Start one match or prepare a tournament bracket.')}</p>
    </div>
    <div className="mode-cards">
      <button className="mode-card" onClick={onSingleMatch}>
        <span className="mode-icon" aria-hidden="true">1</span>
        <span><strong>{t('Single match')}</strong><small>{t('Create and run one match.')}</small></span>
        <span aria-hidden="true">→</span>
      </button>
      <button className="mode-card tournament" onClick={onTournament}>
        <span className="mode-icon" aria-hidden="true">⌘</span>
        <span><strong>{t('Tournament')}</strong><small>{t('Set the time, athletes and bracket.')}</small></span>
        <span aria-hidden="true">→</span>
      </button>
    </div>
  </main>;
}
