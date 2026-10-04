import { SpectatorScreen } from "../spectator-screen";
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
    <SpectatorScreen
      className="tournament-display-intro"
      label="Tournament presentation"
      variant={spectatorBackground}
      image={spectatorBackgroundImage}
      animated={spectatorBackgroundAnimated}
      preset={spectatorAnimationPreset}
    >
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
    </SpectatorScreen>
  );
}
