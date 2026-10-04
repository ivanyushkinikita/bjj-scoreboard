import { useMemo } from "react";
import Particles, {
  ParticlesProvider,
  useParticlesProvider,
  type ParticlesPluginRegistrar,
} from "@tsparticles/react";
import { loadEmittersPluginSimple } from "@tsparticles/plugin-emitters/plugin";
import { loadSlim } from "@tsparticles/slim";
import { loadWobbleUpdater } from "@tsparticles/updater-wobble";
import { getSpectatorParticleOptions } from "./spectatorParticleOptions";
import type { SpectatorBackgroundParticlesProps } from "./SpectatorBackgroundParticles.types";

const initializeParticles: ParticlesPluginRegistrar = async (engine) => {
  await loadSlim(engine);
  await loadEmittersPluginSimple(engine);
  await loadWobbleUpdater(engine);
};

function ParticleCanvas({ preset }: SpectatorBackgroundParticlesProps) {
  const { loaded } = useParticlesProvider();
  const options = useMemo(() => getSpectatorParticleOptions(preset), [preset]);
  return loaded ? (
    <Particles
      id="spectator-background-particles"
      className="spectator-background__particles"
      options={options}
    />
  ) : null;
}

export function SpectatorBackgroundParticles({
  preset,
}: SpectatorBackgroundParticlesProps) {
  return (
    <ParticlesProvider init={initializeParticles}>
      <ParticleCanvas preset={preset} />
    </ParticlesProvider>
  );
}
