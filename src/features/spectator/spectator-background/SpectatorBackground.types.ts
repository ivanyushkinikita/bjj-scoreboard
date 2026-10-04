import type {
  SpectatorAnimationPreset,
  SpectatorBackground as SpectatorBackgroundId,
  SpectatorBackgroundImage,
} from "../../../types/tournament";

export interface SpectatorBackgroundProps {
  animated?: boolean;
  image?: SpectatorBackgroundImage;
  preset?: SpectatorAnimationPreset;
  preview?: boolean;
  variant: SpectatorBackgroundId;
}
