import { describe, expect, it } from 'vitest';
import { getSpectatorParticleOptions } from '../components/spectatorParticleOptions';
import { normalizeSpectatorAnimationPreset, spectatorAnimationPresets } from './tournament';

describe('spectator animation presets', () => {
  it('keeps every supported smoke and mist preset', () => {
    expect(spectatorAnimationPresets).toEqual([
      'arena-dust',
      'floating-embers',
      'minimal-energy',
      'side-smoke',
      'low-fog',
      'red-blue-mist',
      'cinematic',
    ]);
  });

  it('falls back to arena dust for values stored by unknown versions', () => {
    expect(normalizeSpectatorAnimationPreset('unknown-preset')).toBe('arena-dust');
  });

  it('uses two low-intensity emitters for the side smoke preset', () => {
    const options = getSpectatorParticleOptions('side-smoke') as typeof getSpectatorParticleOptions extends (...args: never[]) => infer Result ? Result & { emitters?: Array<{ position: { x: number }; particles: { color: { value: string[] } } }> } : never;

    expect(options.fpsLimit).toBe(30);
    expect(options.emitters).toHaveLength(2);
    expect(options.emitters?.[0].position.x).toBeLessThan(50);
    expect(options.emitters?.[1].position.x).toBeGreaterThan(50);
    expect(options.emitters?.[0].particles.color.value).toContain('#b06e70');
    expect(options.emitters?.[1].particles.color.value).toContain('#667f9e');
  });
});
