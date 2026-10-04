import type { ColorScheme } from "../../../stores/settingsStore";
import type { SpectatorBackground as SpectatorBackgroundId } from "../../../types/tournament";
import arenaDark from "../../../assets/arena-dark.png";
import arenaLight from "../../../assets/arena-light.png";
import ribbonsDark from "../../../assets/ribbons-dark.png";
import ribbonsLight from "../../../assets/ribbons-light.png";
import contourDark from "../../../assets/contour-dark.png";
import contourLight from "../../../assets/contour-light.png";

export const backgroundAssets: Partial<
  Record<SpectatorBackgroundId, Record<ColorScheme, string>>
> = {
  "arena-tatami": { dark: arenaDark, light: arenaLight },
  "ribbons-smoke": { dark: ribbonsDark, light: ribbonsLight },
  "contour-fog": { dark: contourDark, light: contourLight },
};

export const backgroundLabelKeys: Record<SpectatorBackgroundId, string> = {
  none: "No background",
  "arena-tatami": "Arena with tatami",
  "ribbons-smoke": "Belts",
  "contour-fog": "Fog",
  custom: "Custom background",
};
