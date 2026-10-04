import type { CSSProperties } from "react";
import { SpectatorBackground } from "../spectator-background";
import type { TournamentDisplayMatchupProps } from "./TournamentDisplayMatchup.types";

export function TournamentDisplayMatchup({
  athleteA,
  athleteB,
  colorA,
  colorB,
  spectatorBackground = "arena-tatami",
  spectatorBackgroundImage = null,
  spectatorBackgroundAnimated = false,
  spectatorAnimationPreset = "arena-dust",
}: TournamentDisplayMatchupProps) {
  return (
    <main
      className="tournament-display-screen tournament-display-matchup"
      aria-label="Upcoming match"
    >
      <SpectatorBackground
        variant={spectatorBackground}
        image={spectatorBackgroundImage}
        animated={spectatorBackgroundAnimated}
        preset={spectatorAnimationPreset}
      />
      <div className="tournament-display-matchup__content">
        <p
          className="tournament-display-matchup__name"
          style={{ "--athlete-color": colorA } as CSSProperties}
        >
          {athleteA}
        </p>
        <span className="tournament-display-matchup__vs">VS</span>
        <p
          className="tournament-display-matchup__name"
          style={{ "--athlete-color": colorB } as CSSProperties}
        >
          {athleteB}
        </p>
      </div>
    </main>
  );
}
