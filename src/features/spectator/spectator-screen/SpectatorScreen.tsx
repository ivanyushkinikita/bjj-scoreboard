import { SpectatorBackground } from "../spectator-background";
import type { SpectatorScreenProps } from "./SpectatorScreen.types";

export function SpectatorScreen({
  animated,
  children,
  className,
  image,
  label,
  preset,
  variant,
}: SpectatorScreenProps) {
  return (
    <main
      className={`tournament-display-screen ${className}`}
      aria-label={label}
    >
      <SpectatorBackground
        variant={variant}
        image={image}
        animated={animated}
        preset={preset}
      />
      {children}
    </main>
  );
}
