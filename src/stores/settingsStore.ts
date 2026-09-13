import { create } from 'zustand';
export type Settings = { locale: 'en' | 'ru'; startSound: boolean; endSound: boolean };
const KEY = 'tatami.settings.v1';
const defaults: Settings = { locale: 'ru', startSound: true, endSound: true };
function read(): Settings {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || 'null');
    return value ? { locale: value.locale === 'en' ? 'en' : 'ru', startSound: typeof value.startSound === 'boolean' ? value.startSound : true, endSound: typeof value.endSound === 'boolean' ? value.endSound : true } : defaults;
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
