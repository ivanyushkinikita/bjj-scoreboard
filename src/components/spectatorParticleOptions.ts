import type { ISourceOptions } from '@tsparticles/engine';
import type { SpectatorAnimationPreset } from '../types/tournament';

const baseOptions: ISourceOptions = {
  detectRetina: false,
  fpsLimit: 30,
  fullScreen: { enable: false },
  interactivity: {
    events: { onClick: { enable: false }, onHover: { enable: false }, resize: true },
  },
  particles: {
    collisions: { enable: false },
    links: { enable: false },
    move: { enable: true, direction: 'top', outModes: { default: 'out' }, random: true },
  },
};

export function getSpectatorParticleOptions(preset: SpectatorAnimationPreset): ISourceOptions {
  if (preset === 'floating-embers') return {
    ...baseOptions,
    particles: {
      ...baseOptions.particles,
      color: { value: ['#f7f9ff', '#c6d9ff', '#ffc8c8'] },
      move: { ...baseOptions.particles?.move, speed: { min: 0.22, max: 0.46 } },
      number: { value: 22 },
      opacity: { value: { min: 0.07, max: 0.24 }, animation: { enable: true, speed: 0.26, sync: false } },
      size: { value: { min: 1, max: 3 } },
    },
  };
  if (preset === 'minimal-energy') return {
    ...baseOptions,
    particles: {
      ...baseOptions.particles,
      color: { value: ['#c5ddff', '#ffd3d3'] },
      move: { ...baseOptions.particles?.move, speed: { min: 0.08, max: 0.18 } },
      number: { value: 28 },
      opacity: { value: { min: 0.04, max: 0.13 }, animation: { enable: true, speed: 0.13, sync: false } },
      size: { value: { min: 0.5, max: 1.5 } },
    },
  };
  return {
    ...baseOptions,
    particles: {
      ...baseOptions.particles,
      color: { value: '#f3f6ff' },
      move: { ...baseOptions.particles?.move, speed: { min: 0.28, max: 0.55 } },
      number: { value: 34 },
      opacity: { value: { min: 0.06, max: 0.24 } },
      size: { value: { min: 1, max: 3 } },
    },
  };
}
