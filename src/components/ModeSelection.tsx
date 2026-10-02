import { useTranslation } from '../app/i18n';
import singleMatchIcon from '../assets/single-match-icon.png';
import tournamentIcon from '../assets/tournament-icon.png';

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
        <span className="mode-icon"><img src={singleMatchIcon} alt="" /></span>
        <strong>{t('Single match')}</strong>
      </button>
      <button className="mode-card tournament" onClick={onTournament}>
        <span className="mode-icon"><img src={tournamentIcon} alt="" /></span>
        <strong>{t('Tournament')}</strong>
      </button>
    </div>
  </main>;
}
