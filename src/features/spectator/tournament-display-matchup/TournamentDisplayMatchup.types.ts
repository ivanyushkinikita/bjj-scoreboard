import type {
  SpectatorAnimationPreset,
  SpectatorBackground as SpectatorBackgroundId,
  SpectatorBackgroundImage,
} from "../../../types/tournament";

export interface TournamentDisplayMatchupProps {
  athleteA: string;
  athleteB: string;
  colorA: string;
  colorB: string;
  spectatorAnimationPreset?: SpectatorAnimationPreset;
  spectatorBackground?: SpectatorBackgroundId;
  spectatorBackgroundAnimated?: boolean;
  spectatorBackgroundImage?: SpectatorBackgroundImage;
}
