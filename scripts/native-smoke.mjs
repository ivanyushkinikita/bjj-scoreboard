import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
async function ensureEnglish(page) {
  const changed = await page.evaluate(() => {
    const key='tatami.settings.v1', value=JSON.parse(localStorage.getItem(key)||'null');
    if(value?.locale==='en' && value.startSound && value.endSound) return false;
    localStorage.setItem(key,JSON.stringify({locale:'en',startSound:true,endSound:true})); return true;
  });
  if(changed) await page.reload();
}

if (process.argv[2] === 'release') {
  const app = spawn('src-tauri/target/release/tatami-scoreboard.exe', [], { env: { ...process.env, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: '--remote-debugging-port=9223' }, stdio: 'inherit', windowsHide: true });
  for (let i = 0; i < 150; i++) { if (await fetch('http://127.0.0.1:9223/json/list').then(r => r.json()).then(p => p.length > 0).catch(() => false)) break; await delay(100); }
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const context = browser.contexts()[0], page = context.pages()[0];
  await expect(page).toHaveURL(/tauri\.localhost/);
  await ensureEnglish(page);
  await context.route('**/*', route => {
    const hostname = new URL(route.request().url()).hostname;
    return ['tauri.localhost','ipc.localhost'].includes(hostname) ? route.continue() : route.abort();
  });
  if (await page.getByRole('button',{name:'START NEW MATCH',exact:true}).isVisible()) await page.getByRole('button',{name:'START NEW MATCH',exact:true}).click();
  await page.getByLabel('Competitor A',{exact:true}).fill('Ivan');
  await page.getByLabel('Competitor B',{exact:true}).fill('Petr');
  await page.getByLabel('Settings',{exact:true}).click();
  await page.getByLabel('Grappling · UWW',{exact:true}).check();
  await page.getByLabel('Close dialog').click();
  await page.getByLabel('Athlete color A').selectOption('red');
  await page.getByLabel('Athlete color B').selectOption('blue');
  await page.getByRole('button',{name:/^START MATCH/}).click();
  await page.getByRole('button',{name:'Open Scoreboard Display',exact:false}).click();
  await expect.poll(() => context.pages().find(p => p.url().includes('display=1'))).toBeTruthy();
  const display = context.pages().find(p => p.url().includes('display=1'));
  await page.getByLabel('A plus 2',{exact:true}).click();
  await page.getByLabel('B plus 4',{exact:true}).click();
  await expect(display.getByTestId('score-A')).toHaveText('2');
  await expect(display.getByTestId('score-B')).toHaveText('4');
  await page.evaluate(() => {
    window.soundStarts=0;
    const original=AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start=function(...args){window.soundStarts++;return original.apply(this,args);};
  });
  await page.keyboard.press('Backspace');
  await page.getByRole('button',{name:'Confirm',exact:true}).click();
  await page.keyboard.press('Space');
  await expect.poll(()=>page.evaluate(()=>window.soundStarts)).toBe(1);
  await page.getByLabel('Edit remaining time').click();
  await page.getByRole('textbox',{name:'Remaining time'}).fill('00:01');
  await page.getByRole('button',{name:'Confirm change'}).click();
  await expect(display.getByText('TIME EXPIRED',{exact:true})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>window.soundStarts)).toBe(2);
  await page.getByRole('button',{name:'Submission',exact:true}).click();
  await page.getByRole('button',{name:'BLUE Petr'}).click();
  await page.getByRole('button',{name:'Confirm victory'}).click();
  await expect(display.getByRole('dialog',{name:'Winner'}).getByRole('heading',{name:'Petr'})).toBeVisible();
  await expect(display.getByRole('dialog',{name:'Winner'})).toHaveClass(/blue/);
  fs.mkdirSync('test-results/native',{recursive:true});
  await display.screenshot({path:'test-results/native/release-winner.png',animations:'disabled'});
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button',{name:'Back to scoreboard'}).click();
  await page.getByLabel('Settings',{exact:true}).click();
  await page.getByLabel('Language',{exact:true}).selectOption('ru');
  await expect(display.locator('html')).toHaveAttribute('lang','ru');
  await page.getByLabel('Закрыть диалог').click();
  fs.mkdirSync('test-results/native',{recursive:true});
  await page.screenshot({path:'test-results/native/release-control.png'});
  await page.getByRole('button',{name:'Новая схватка',exact:true}).click();
  await page.getByRole('button',{name:'Подтвердить',exact:true}).click();
  await page.evaluate(() => window.__TAURI_INTERNALS__.invoke('plugin:window|close',{label:'main'}));
  await browser.close();
  if (app.exitCode === null) await new Promise(resolve => app.once('exit', resolve));
  console.log('PASS release smoke: offline bundled frontend, native display sync, gong sounds, Space/Backspace, UWW preset, red/blue colors, winner presentation, Russian locale and submission.');
  process.exit(0);
}

if (process.argv[2] === 'run') {
  let vite;
  if (!await fetch('http://localhost:1420').then(r => r.ok).catch(() => false)) {
    vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1'], { stdio: 'inherit', windowsHide: true });
    for (let i = 0; i < 100; i++) { if (await fetch('http://localhost:1420').then(r => r.ok).catch(() => false)) break; await delay(100); }
  }
  try {
    for (const phase of ['first', 'second']) {
      const app = spawn('src-tauri/target/debug/tatami-scoreboard.exe', [], { env: { ...process.env, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: '--remote-debugging-port=9223' }, stdio: 'inherit', windowsHide: true });
      for (let i = 0; i < 150; i++) { if (await fetch('http://127.0.0.1:9223/json/list').then(r => r.json()).then(p => p.length > 0).catch(() => false)) break; await delay(100); }
      const check = spawn(process.execPath, ['scripts/native-smoke.mjs', phase], { stdio: 'inherit', windowsHide: true });
      const code = await new Promise(resolve => check.once('exit', resolve));
      if (code !== 0) throw new Error(`Native phase ${phase} failed (${code}); application left open for inspection.`);
      if (app.exitCode === null) await new Promise(resolve => app.once('exit', resolve));
      await delay(700);
    }
  } finally { vite?.kill(); }
  process.exit(0);
}

// Attach only to the debug WebView2 instance explicitly launched for this test.
// Start Tauri dev with WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9223.
const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
const context = browser.contexts()[0];
const page = context.pages().find(p => !p.url().includes('display=1'));
if (!page) throw new Error('Control WebView not found');
const phase = process.argv[2] || 'first';
if(phase!=='probe') await ensureEnglish(page);
if (phase === 'probe') {
  console.log('pages', context.pages().map(p => p.url()));
  console.log('windows', await page.evaluate(async () => {
    const api = await import('/node_modules/@tauri-apps/api/webviewWindow.js');
    return (await api.getAllWebviewWindows()).map(w => w.label);
  }));
  console.log(await page.locator('body').innerText());
  await browser.close();
  process.exit(0);
}
fs.mkdirSync('test-results/native', { recursive: true });
page.on('console', message => { if (message.type() === 'error') console.error('WEBVIEW:', message.text()); });
page.on('pageerror', error => console.error('PAGE ERROR:', error));
if (phase === 'first') {
  if (await page.getByRole('button', {name:'START NEW MATCH',exact:true}).isVisible()) await page.getByRole('button', {name:'START NEW MATCH',exact:true}).click();
  if (await page.getByRole('button', {name:'New match',exact:true}).isVisible()) {
    await page.getByRole('button', {name:'New match',exact:true}).click();
    await page.getByRole('button', {name:'Confirm',exact:true}).click();
  }
  await page.getByLabel('Competitor A', {exact:true}).fill('Ivan');
  await page.getByLabel('Competitor B', {exact:true}).fill('Petr');
  await page.getByRole('button',{name:'5m',exact:true}).click();
  await page.getByRole('button',{name:/^START MATCH/}).click();
  await page.getByRole('button',{name:'Open Scoreboard Display',exact:false}).click();
  await expect.poll(() => context.pages().find(p => p.url().includes('display=1'))).toBeTruthy();
  const display = context.pages().find(p => p.url().includes('display=1'));
  await expect(display.getByRole('heading',{name:'Ivan',exact:true})).toBeVisible();
  await expect(display.getByRole('button')).toHaveCount(0);
  await page.getByRole('button',{name:'START TIMER'}).click();
  await page.getByLabel('A plus 2',{exact:true}).click();
  await page.getByLabel('B plus 4',{exact:true}).click();
  await page.getByLabel('A advantages plus',{exact:true}).click();
  await page.getByLabel('B penalties plus',{exact:true}).click();
  await page.getByRole('button',{name:'Undo',exact:false}).click();
  await expect(display.getByTestId('penalties-B')).toHaveText('0');
  await page.getByRole('button',{name:'Redo',exact:false}).click();
  await expect(display.getByTestId('penalties-B')).toHaveText('1');
  await expect(display.getByTestId('score-A')).toHaveText('2');
  await expect(display.getByTestId('score-B')).toHaveText('4');
  await page.getByRole('button',{name:'PAUSE'}).click();
  await page.getByLabel('Edit remaining time').click();
  await page.getByRole('textbox',{name:'Remaining time'}).fill('04:00');
  await page.getByRole('button',{name:'Confirm change'}).click();
  await page.getByLabel('Settings',{exact:true}).click();
  await page.getByRole('button',{name:'Display settings'}).click();
  await expect(page.getByRole('combobox').locator('option')).not.toHaveCount(1);
  await page.getByRole('combobox').selectOption('0');
  await page.getByRole('button',{name:'Toggle display fullscreen'}).click();
  await expect.poll(() => page.evaluate(async () => {
    const { WebviewWindow } = await import('/node_modules/@tauri-apps/api/webviewWindow.js');
    return (await WebviewWindow.getByLabel('display')).isFullscreen();
  })).toBe(true);
  await page.getByRole('button',{name:'Toggle display fullscreen'}).click();
  await page.getByRole('button',{name:'Close dialog'}).click();
  await page.screenshot({path:'test-results/native/control.png'});
  await display.screenshot({path:'test-results/native/display.png'});
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button',{name:'RESUME'}).click();
  await page.evaluate(async () => { const { getCurrentWindow } = await import('/node_modules/@tauri-apps/api/window.js'); await getCurrentWindow().close(); });
  await expect(page.getByText('A match is currently running.',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.evaluate(async () => { const { getCurrentWindow } = await import('/node_modules/@tauri-apps/api/window.js'); await getCurrentWindow().close(); });
  await page.getByRole('button',{name:'Confirm',exact:true}).click();
  console.log('PASS native phase 1: scoring, Tauri events, monitor positioning, fullscreen, close confirmation and persistence.');
} else {
  await page.getByRole('button',{name:'RESTORE PREVIOUS MATCH'}).click();
  await expect(page.getByTestId('score-A')).toHaveText('2');
  await expect(page.getByTestId('score-B')).toHaveText('4');
  await page.getByRole('button',{name:'Open Scoreboard Display',exact:false}).click();
  await expect.poll(() => context.pages().find(p => p.url().includes('display=1'))).toBeTruthy();
  const display = context.pages().find(p => p.url().includes('display=1'));
  await expect(display.getByTestId('advantages-A')).toHaveText('1');
  await expect(display.getByTestId('penalties-B')).toHaveText('1');
  await page.getByLabel('Edit remaining time').click();
  await page.getByRole('textbox',{name:'Remaining time'}).fill('00:01');
  await page.getByRole('button',{name:'Confirm change'}).click();
  // If installation/testing took longer than four minutes, the restored clock is paused after correction.
  if (await page.getByRole('button',{name:'RESUME'}).isEnabled().catch(() => false)) await page.getByRole('button',{name:'RESUME'}).click();
  await expect(display.getByText('TIME EXPIRED',{exact:true})).toBeVisible();
  await expect(display.getByText('Petr LEADS')).toBeVisible();
  await page.getByRole('button',{name:'Confirm result'}).click();
  await page.getByRole('button',{name:'Confirm victory'}).click();
  await expect(display.getByRole('dialog',{name:'Winner'}).getByRole('heading',{name:'Petr'})).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await display.screenshot({path:'test-results/native/final-result.png'});
  await page.evaluate(async () => { const { getCurrentWindow } = await import('/node_modules/@tauri-apps/api/window.js'); await getCurrentWindow().close(); });
  console.log('PASS native phase 2: process restart, recovery, display resync, expiry, confirmed result and clean close.');
}
await browser.close();
