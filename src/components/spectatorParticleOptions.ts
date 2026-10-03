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

const smoke = (colors: string[], direction: 'top-left' | 'top-right' | 'left' | 'right', speed: { min: number; max: number }, size: { min: number; max: number }, life = 18) => ({
  color: { value: colors },
  life: { count: 1, duration: { value: life }, delay: { value: 0 } },
  move: { enable: true, direction, outModes: { default: 'destroy' }, random: true, speed, straight: false },
  opacity: { value: { min: 0.018, max: 0.07 }, animation: { enable: true, speed: 0.12, startValue: 'max', destroy: 'min', sync: false } },
  shape: { type: 'circle' },
  size: { value: size, animation: { enable: true, speed: 0.22, startValue: 'min', destroy: 'none', sync: false } },
  wobble: { enable: true, distance: { min: 8, max: 24 }, speed: { angle: { min: 1, max: 3 }, move: { min: 2, max: 6 } } },
});

const sideSmokeEmitters = (intensity = 1) => [
  { position: { x: 7, y: 96 }, rate: { quantity: 1, delay: 1.9 / intensity }, particles: smoke(['#d8cbcb', '#b06e70', '#7e5358'], 'top-right', { min: 0.08, max: 0.2 }, { min: 88, max: 185 }) },
  { position: { x: 93, y: 96 }, rate: { quantity: 1, delay: 1.9 / intensity }, particles: smoke(['#cbd3dc', '#667f9e', '#4d6687'], 'top-left', { min: 0.08, max: 0.2 }, { min: 88, max: 185 }) },
];

const mistEmitters = [
  { position: { x: 9, y: 69 }, rate: { quantity: 1, delay: 2.4 }, particles: smoke(['#d5c9ca', '#a46065'], 'right', { min: 0.05, max: 0.14 }, { min: 130, max: 250 }, 22) },
  { position: { x: 91, y: 69 }, rate: { quantity: 1, delay: 2.4 }, particles: smoke(['#c9d1dc', '#5d7696'], 'left', { min: 0.05, max: 0.14 }, { min: 130, max: 250 }, 22) },
];

const lowFogEmitters = [
  { position: { x: 8, y: 90 }, rate: { quantity: 1, delay: 2.6 }, particles: smoke(['#d2d5d8', '#a7acb1'], 'right', { min: 0.03, max: 0.09 }, { min: 130, max: 245 }, 16) },
  { position: { x: 92, y: 90 }, rate: { quantity: 1, delay: 2.6 }, particles: smoke(['#d2d5d8', '#a7acb1'], 'left', { min: 0.03, max: 0.09 }, { min: 130, max: 245 }, 16) },
];

const emitterOptions = (emitters: unknown, particles: ISourceOptions['particles'] = { ...baseOptions.particles, number: { value: 0 } }): ISourceOptions => ({
  ...baseOptions,
  particles,
  emitters,
} as ISourceOptions);

export function getSpectatorParticleOptions(preset: SpectatorAnimationPreset): ISourceOptions {
  if (preset === 'side-smoke') return emitterOptions(sideSmokeEmitters());
  if (preset === 'low-fog') return emitterOptions(lowFogEmitters);
  if (preset === 'red-blue-mist') return emitterOptions(mistEmitters);
  if (preset === 'cinematic') return emitterOptions(sideSmokeEmitters(0.45), {
    ...baseOptions.particles,
    color: { value: ['#e8e3dc', '#d7e2ef'] },
    move: { ...baseOptions.particles?.move, speed: { min: 0.08, max: 0.18 } },
    number: { value: 9 },
    opacity: { value: { min: 0.025, max: 0.09 }, animation: { enable: true, speed: 0.12, sync: false } },
    size: { value: { min: 0.8, max: 2.2 } },
  });
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
