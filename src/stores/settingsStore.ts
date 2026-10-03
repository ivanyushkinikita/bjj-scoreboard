import { create } from 'zustand';
import type { GongSound } from '../services/audio';
import { isAnimatableSpectatorBackground, normalizeSpectatorAnimationPreset, normalizeSpectatorBackground, normalizeSpectatorBackgroundImage, normalizeSpectatorLogo, type SpectatorAnimationPreset, type SpectatorBackground, type SpectatorBackgroundImage } from '../types/tournament';
const KEY = 'tatami.settings.v1';
export type ColorScheme = 'dark' | 'light';
export type Settings = { locale: 'en' | 'ru'; colorScheme: ColorScheme; spectatorLogo: string | null; spectatorBackground: SpectatorBackground; spectatorBackgroundImage: SpectatorBackgroundImage; spectatorBackgroundAnimated: boolean; spectatorAnimationPreset: SpectatorAnimationPreset; spectatorTimerBackground: boolean; startSound: boolean; startSoundVariant: GongSound; endSound: boolean; endSoundVariant: GongSound };
const defaults: Settings = { locale: 'ru', colorScheme: 'dark', spectatorLogo: null, spectatorBackground: 'arena-tatami', spectatorBackgroundImage: null, spectatorBackgroundAnimated: false, spectatorAnimationPreset: 'arena-dust', spectatorTimerBackground: true, startSound: true, startSoundVariant: 'bright', endSound: true, endSoundVariant: 'bright' };
function read(): Settings {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || 'null');
    const spectatorBackground = normalizeSpectatorBackground(value?.spectatorBackground);
    return value ? { locale: value.locale === 'en' ? 'en' : 'ru', colorScheme: value.colorScheme === 'light' ? 'light' : 'dark', spectatorLogo: normalizeSpectatorLogo(value.spectatorLogo), spectatorBackground, spectatorBackgroundImage: normalizeSpectatorBackgroundImage(value.spectatorBackgroundImage), spectatorBackgroundAnimated: isAnimatableSpectatorBackground(spectatorBackground) && value.spectatorBackgroundAnimated === true, spectatorAnimationPreset: normalizeSpectatorAnimationPreset(value.spectatorAnimationPreset), spectatorTimerBackground: typeof value.spectatorTimerBackground === 'boolean' ? value.spectatorTimerBackground : true, startSound: typeof value.startSound === 'boolean' ? value.startSound : true, startSoundVariant: ['bright','classic','chime'].includes(value.startSoundVariant) ? value.startSoundVariant : 'bright', endSound: typeof value.endSound === 'boolean' ? value.endSound : true, endSoundVariant: ['bright','classic','chime'].includes(value.endSoundVariant) ? value.endSoundVariant : 'bright' } : defaults;
  } catch { return defaults; }
}
export const useSettingsStore = create<{ settings: Settings; update: (value: Partial<Settings>) => void; replace: (settings: Settings) => void }>((set, get) => ({
  settings: read(),
  update: value => {
    const next = { ...get().settings, ...value };
    const settings = { ...next, spectatorLogo: normalizeSpectatorLogo(next.spectatorLogo), spectatorBackgroundAnimated: isAnimatableSpectatorBackground(next.spectatorBackground) && next.spectatorBackgroundAnimated === true, spectatorAnimationPreset: normalizeSpectatorAnimationPreset(next.spectatorAnimationPreset) };
    localStorage.setItem(KEY, JSON.stringify(settings));
    set({ settings });
  },
  replace: settings => {
    const spectatorBackground = normalizeSpectatorBackground(settings.spectatorBackground);
    set({ settings: { ...defaults, ...settings, spectatorLogo: normalizeSpectatorLogo(settings.spectatorLogo), spectatorBackground, spectatorBackgroundImage: normalizeSpectatorBackgroundImage(settings.spectatorBackgroundImage), spectatorBackgroundAnimated: isAnimatableSpectatorBackground(spectatorBackground) && settings.spectatorBackgroundAnimated === true, spectatorAnimationPreset: normalizeSpectatorAnimationPreset(settings.spectatorAnimationPreset) } });
  },
}));
