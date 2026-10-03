let context: AudioContext | undefined;
const buffers = new Map<string, Promise<AudioBuffer>>();
export type GongSound = 'bright' | 'classic' | 'chime';
const gongPaths: Record<GongSound, string> = {
  bright: '/sounds/horn.wav',
  classic: '/sounds/horn-classic.wav',
  chime: '/sounds/horn-chime.wav',
};
const startPaths: Record<GongSound, string> = {
  bright: '/sounds/start.wav',
  classic: '/sounds/start-classic.wav',
  chime: '/sounds/start-chime.wav',
};
const getContext = () => context ??= new AudioContext();
export async function unlockAudio() { await getContext().resume(); }
async function playAsset(path: string) {
  const audio = getContext();
  await audio.resume();
  if (!buffers.has(path)) buffers.set(path, fetch(path).then(response => {
    if (!response.ok) throw new Error('Sound asset could not be loaded');
    return response.arrayBuffer();
  }).then(data => audio.decodeAudioData(data)));
  const source = audio.createBufferSource();
  source.buffer = await buffers.get(path)!;
  source.connect(audio.destination);
  source.start();
}
export const playHorn = (sound: GongSound = 'bright') => playAsset(gongPaths[sound]);
export const playStart = (sound: GongSound = 'bright') => playAsset(startPaths[sound]);
