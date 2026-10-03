import { useMemo } from 'react';
import Particles, { ParticlesProvider, useParticlesProvider, type ParticlesPluginRegistrar } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { SpectatorAnimationPreset } from '../types/tournament';
import { getSpectatorParticleOptions } from './spectatorParticleOptions';

const initializeParticles: ParticlesPluginRegistrar = async engine => { await loadSlim(engine); };

function ParticleCanvas({ preset }: { preset: SpectatorAnimationPreset }) {
  const { loaded } = useParticlesProvider();
  const options = useMemo(() => getSpectatorParticleOptions(preset), [preset]);
  return loaded ? <Particles id="spectator-background-particles" className="spectator-background__particles" options={options} /> : null;
}

export function SpectatorBackgroundParticles({ preset }: { preset: SpectatorAnimationPreset }) {
  return <ParticlesProvider init={initializeParticles}><ParticleCanvas preset={preset}/></ParticlesProvider>;
}
