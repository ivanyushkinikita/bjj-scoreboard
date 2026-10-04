import { useEffect, useState, type CSSProperties } from "react";
import { useSettingsStore } from "../../../stores/settingsStore";
import { isAnimatableSpectatorBackground } from "../../../types/tournament";
import { SpectatorBackgroundParticles } from "../spectator-background-particles";
import type { SpectatorBackgroundProps } from "./SpectatorBackground.types";
import { backgroundAssets } from "./SpectatorBackground.utils";

export function SpectatorBackground({
  variant,
  image = null,
  animated = false,
  preset = "arena-dust",
  preview = false,
}: SpectatorBackgroundProps) {
  const colorScheme = useSettingsStore((state) => state.settings.colorScheme);
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );
  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    const update = () => setReducedMotion(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  if (variant === "none") return null;
  const source =
    backgroundAssets[variant]?.[colorScheme] ??
    (variant === "custom" ? image : null);
  const shouldAnimate =
    animated && isAnimatableSpectatorBackground(variant) && !reducedMotion;
  return (
    <div
      className={`spectator-background spectator-background--${variant}${source ? " spectator-background--image" : ""}${shouldAnimate ? ` spectator-background--preset-${preset}` : ""}${preview ? " spectator-background--preview" : ""}`}
      style={
        source
          ? ({ "--spectator-image": `url("${source}")` } as CSSProperties)
          : undefined
      }
      aria-hidden="true"
    >
      {shouldAnimate && (
        <>
          <SpectatorBackgroundParticles preset={preset} />
          <span className="spectator-background__glow spectator-background__glow--blue" />
          <span className="spectator-background__glow spectator-background__glow--red" />
          <span className="spectator-background__sweep" />
          <span className="spectator-background__vignette" />
        </>
      )}
    </div>
  );
}
