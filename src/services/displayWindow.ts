import { isTauri } from '@tauri-apps/api/core';
import { emitTo, listen } from '@tauri-apps/api/event';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { availableMonitors, getCurrentWindow, PhysicalPosition } from '@tauri-apps/api/window';
import { useMatchStore } from '../stores/matchStore';
import type { MatchState } from '../types/match';
import { useSettingsStore, type Settings } from '../stores/settingsStore';
type Snapshot = { match: MatchState; settings: Settings };
const snapshot = (): Snapshot => ({ match: useMatchStore.getState().match, settings: useSettingsStore.getState().settings });
function receive(value: Snapshot) { useMatchStore.getState().replace(value.match); useSettingsStore.getState().replace(value.settings); }
export const isDisplay = new URLSearchParams(location.search).get('display') === '1';
let popup: Window | null = null;
export async function synchronize(onError: (message: string) => void): Promise<() => void> {
  if (isTauri()) {
    if (isDisplay) {
      const off = await listen<Snapshot>('match-state', e => receive(e.payload));
      await emitTo('main', 'display-ready');
      return off;
    }
    const send = () => emitTo('display', 'match-state', snapshot()).catch(e => onError(String(e)));
    const off = await listen('display-ready', send);
    const unsub = useMatchStore.subscribe(send);
    const offSettings = useSettingsStore.subscribe(send);
    return () => { off(); unsub(); offSettings(); };
  }
  const channel = new BroadcastChannel('tatami-display');
  const send = () => channel.postMessage({ type: 'state', snapshot: snapshot() });
  channel.onmessage = e => {
    if (isDisplay && e.data.type === 'state') receive(e.data.snapshot);
    if (!isDisplay && e.data.type === 'ready') send();
  };
  const unsub = isDisplay ? () => {} : useMatchStore.subscribe(send);
  const offSettings = isDisplay ? () => {} : useSettingsStore.subscribe(send);
  if (isDisplay) channel.postMessage({ type: 'ready' });
  return () => { unsub(); offSettings(); channel.close(); };
}
export async function openDisplay() {
  if (!isTauri()) {
    popup = window.open('/?display=1', 'tatami-display', 'popup,width=1280,height=720');
    if (!popup) throw new Error('Allow pop-up windows to open the scoreboard display.');
    popup.focus(); return;
  }
  const existing = await WebviewWindow.getByLabel('display');
  if (existing) { await existing.setFocus(); return; }
  await new Promise<void>((resolve, reject) => {
    const w = new WebviewWindow('display', { url: 'index.html?display=1', title: 'Tatami — Scoreboard Display', width: 1280, height: 720, minWidth: 800, minHeight: 500 });
    void w.once('tauri://created', () => resolve());
    void w.once('tauri://error', e => reject(new Error(String(e.payload))));
  });
}
export async function closeDisplay() {
  if (isTauri()) await (await WebviewWindow.getByLabel('display'))?.close();
  else popup?.close();
}
export async function fullscreen(display = false) {
  if (isTauri()) {
    const w = display ? await WebviewWindow.getByLabel('display') : getCurrentWindow();
    if (!w) throw new Error('Open the scoreboard display first.');
    await w.setFullscreen(!await w.isFullscreen());
  } else {
    const doc = display ? popup?.document : document;
    if (!doc) throw new Error('Open the scoreboard display first.');
    if (doc.fullscreenElement) await doc.exitFullscreen(); else await doc.documentElement.requestFullscreen();
  }
}
export async function monitors() { return isTauri() ? availableMonitors() : []; }
export async function moveDisplay(index: number) {
  const w = await WebviewWindow.getByLabel('display');
  const monitor = (await availableMonitors())[index];
  if (!w || !monitor) throw new Error('Open the display and select an available monitor.');
  await w.setFullscreen(false);
  await w.setPosition(new PhysicalPosition(monitor.position.x, monitor.position.y));
}
export async function guardClose(request: () => void) {
  if (!isTauri()) return () => {};
  return getCurrentWindow().onCloseRequested(async e => {
    e.preventDefault(); request();
  });
}
export async function exitApplication() { await closeDisplay(); if (isTauri()) await getCurrentWindow().destroy(); }
