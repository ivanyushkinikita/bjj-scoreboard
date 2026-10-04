import type { ReactNode } from "react";
import type {
  SpectatorAnimationPreset,
  SpectatorBackground as SpectatorBackgroundId,
  SpectatorBackgroundImage,
} from "../../../types/tournament";

export interface SpectatorScreenProps {
  animated: boolean;
  children: ReactNode;
  className: string;
  image: SpectatorBackgroundImage;
  label: string;
  preset: SpectatorAnimationPreset;
  variant: SpectatorBackgroundId;
}
