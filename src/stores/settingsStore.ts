import { create } from 'zustand';
import type { GongSound } from '../services/audio';
const KEY = 'tatami.settings.v1';
export type ColorScheme = 'dark' | 'light';
export type Settings = { locale: 'en' | 'ru'; colorScheme: ColorScheme; startSound: boolean; startSoundVariant: GongSound; endSound: boolean; endSoundVariant: GongSound };
const defaults: Settings = { locale: 'ru', colorScheme: 'dark', startSound: true, startSoundVariant: 'bright', endSound: true, endSoundVariant: 'bright' };
function read(): Settings {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || 'null');
    return value ? { locale: value.locale === 'en' ? 'en' : 'ru', colorScheme: value.colorScheme === 'light' ? 'light' : 'dark', startSound: typeof value.startSound === 'boolean' ? value.startSound : true, startSoundVariant: ['bright','classic','chime'].includes(value.startSoundVariant) ? value.startSoundVariant : 'bright', endSound: typeof value.endSound === 'boolean' ? value.endSound : true, endSoundVariant: ['bright','classic','chime'].includes(value.endSoundVariant) ? value.endSoundVariant : 'bright' } : defaults;
  } catch { return defaults; }
}
export const useSettingsStore = create<{ settings: Settings; update: (value: Partial<Settings>) => void; replace: (settings: Settings) => void }>((set, get) => ({
  settings: read(),
  update: value => {
    const settings = { ...get().settings, ...value };
    localStorage.setItem(KEY, JSON.stringify(settings));
    set({ settings });
  },
  replace: settings => set({ settings }),
}));
