import type { CSSProperties } from 'react';
import type { TournamentPresentation } from '../types/match';
import { SpectatorBackground } from './SpectatorBackground';

type MatchupProps = {
  athleteA: string;
  athleteB: string;
  colorA: string;
  colorB: string;
};

export function TournamentDisplayIntro({ presentation, showBranding = true }: { presentation: TournamentPresentation; showBranding?: boolean }) {
  const title = presentation.name.trim();

  return (
    <main className="tournament-display-screen tournament-display-intro" aria-label="Tournament presentation">
      <SpectatorBackground variant={presentation.spectatorBackground} image={presentation.spectatorBackgroundImage} animated={presentation.spectatorBackgroundAnimated} preset={presentation.spectatorAnimationPreset} />
      {showBranding && <div className="tournament-display-intro__content">
        {presentation.logo ? (
          <img className="tournament-display-intro__logo" src={presentation.logo} alt={title || 'Tournament logo'} />
        ) : title ? (
          <h1 className="tournament-display-intro__title">{title}</h1>
        ) : null}
      </div>}
    </main>
  );
}

export function TournamentDisplayMatchup({ athleteA, athleteB, colorA, colorB, spectatorBackground = 'arena-tatami', spectatorBackgroundImage = null, spectatorBackgroundAnimated = false, spectatorAnimationPreset = 'arena-dust' }: MatchupProps & Pick<TournamentPresentation, 'spectatorBackgroundImage' | 'spectatorBackgroundAnimated' | 'spectatorAnimationPreset'> & { spectatorBackground?: TournamentPresentation['spectatorBackground'] }) {
  return (
    <main className="tournament-display-screen tournament-display-matchup" aria-label="Upcoming match">
      <SpectatorBackground variant={spectatorBackground} image={spectatorBackgroundImage} animated={spectatorBackgroundAnimated} preset={spectatorAnimationPreset} />
      <div className="tournament-display-matchup__content">
        <p className="tournament-display-matchup__name" style={{ '--athlete-color': colorA } as CSSProperties}>
          {athleteA}
        </p>
        <span className="tournament-display-matchup__vs">VS</span>
        <p className="tournament-display-matchup__name" style={{ '--athlete-color': colorB } as CSSProperties}>
          {athleteB}
        </p>
      </div>
    </main>
  );
}
