import type {
  SpectatorAnimationPreset,
  SpectatorBackground as SpectatorBackgroundId,
  SpectatorBackgroundImage,
} from "../../../types/tournament";

export interface SpectatorBackgroundPickerProps {
  animated?: boolean;
  image?: SpectatorBackgroundImage;
  onAnimatedChange?: (animated: boolean) => void;
  onChange: (value: SpectatorBackgroundId) => void;
  onImageChange?: (image: SpectatorBackgroundImage) => void;
  onPresetChange?: (preset: SpectatorAnimationPreset) => void;
  onTimerBackgroundChange?: (visible: boolean) => void;
  preset?: SpectatorAnimationPreset;
  timerBackground?: boolean;
  value: SpectatorBackgroundId;
}
