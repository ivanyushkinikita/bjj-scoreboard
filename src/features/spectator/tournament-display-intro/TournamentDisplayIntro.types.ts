import type { TournamentPresentation } from "../../../types/match";
import type {
  SpectatorAnimationPreset,
  SpectatorBackground as SpectatorBackgroundId,
  SpectatorBackgroundImage,
} from "../../../types/tournament";

export interface TournamentDisplayIntroProps {
  logo: string | null;
  presentation: TournamentPresentation;
  showLogo?: boolean;
  showTournamentTitle?: boolean;
  spectatorAnimationPreset: SpectatorAnimationPreset;
  spectatorBackground: SpectatorBackgroundId;
  spectatorBackgroundAnimated: boolean;
  spectatorBackgroundImage: SpectatorBackgroundImage;
}
