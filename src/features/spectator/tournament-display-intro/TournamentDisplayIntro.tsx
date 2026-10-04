import { SpectatorBackground } from "../spectator-background";
import type { TournamentDisplayIntroProps } from "./TournamentDisplayIntro.types";

export function TournamentDisplayIntro({
  presentation,
  logo,
  spectatorBackground,
  spectatorBackgroundImage,
  spectatorBackgroundAnimated,
  spectatorAnimationPreset,
  showLogo = true,
  showTournamentTitle = true,
}: TournamentDisplayIntroProps) {
  const title = presentation.name.trim();

  return (
    <main
      className="tournament-display-screen tournament-display-intro"
      aria-label="Tournament presentation"
    >
      <SpectatorBackground
        variant={spectatorBackground}
        image={spectatorBackgroundImage}
        animated={spectatorBackgroundAnimated}
        preset={spectatorAnimationPreset}
      />
      {(showLogo || showTournamentTitle) && (
        <div className="tournament-display-intro__content">
          {showLogo && logo && (
            <img
              className="tournament-display-intro__logo"
              src={logo}
              alt={title || "Tournament logo"}
            />
          )}
          {showTournamentTitle && title && (
            <h1 className="tournament-display-intro__title">{title}</h1>
          )}
        </div>
      )}
    </main>
  );
}
