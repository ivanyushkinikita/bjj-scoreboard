let context: AudioContext | undefined;
const buffers = new Map<string, Promise<AudioBuffer>>();
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
export const playHorn = () => playAsset('/sounds/horn.wav');
export const playStart = () => playAsset('/sounds/start.wav');
