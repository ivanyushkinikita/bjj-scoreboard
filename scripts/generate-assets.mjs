import fs from 'node:fs';
// Original metallic gong recordings, rendered offline from damped inharmonic modes.
fs.mkdirSync('public/sounds', {recursive:true});
const rate=44100;
function gong(file,frequency,strikes,seconds) {
 const samples=Math.round(rate*seconds), wav=Buffer.alloc(44+samples*2);
 wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples*2,40);
 const modes=[1,1.47,2.09,2.56,3.81,5.17,6.79,8.21];
 for(let i=0;i<samples;i++) {const t=i/rate;let v=0;for(const strike of strikes) {const u=t-strike;if(u<0)continue;for(let k=0;k<modes.length;k++)v+=Math.sin(2*Math.PI*frequency*modes[k]*u+0.8*Math.sin(2*Math.PI*3.1*u)*Math.exp(-4*u))*Math.exp(-u*(1.2+k*.48))/(1+k*.7)*Math.min(1,u/.003);}v=Math.tanh(v*.48)*.82*Math.min(1,(seconds-t)/.2);wav.writeInt16LE(Math.round(v*32767),44+i*2);}
 fs.writeFileSync('public/sounds/'+file,wav);
}
gong('start.wav',740,[0],2.4); // One bright high gong.
gong('horn.wav',390,[0,.55],3.5); // Two lower, resonant gong strikes.
// 32-bit ICO containing a simple original mat / T monogram.
fs.mkdirSync('src-tauri/icons', { recursive: true });
const size = 32, pixels = size * size * 4, mask = size * 4, ico = Buffer.alloc(22 + 40 + pixels + mask);
ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4); ico[6] = size; ico[7] = size; ico.writeUInt16LE(1, 10); ico.writeUInt16LE(32, 12); ico.writeUInt32LE(40 + pixels + mask, 14); ico.writeUInt32LE(22, 18);
ico.writeUInt32LE(40,22); ico.writeInt32LE(size,26); ico.writeInt32LE(size*2,30); ico.writeUInt16LE(1,34); ico.writeUInt16LE(32,36); ico.writeUInt32LE(pixels,42);
for(let y=0;y<size;y++) for(let x=0;x<size;x++){ const mark = (y>=8&&y<=12&&x>=6&&x<=25)||(x>=14&&x<=18&&y>=12&&y<=25); const offset=62+((size-1-y)*size+x)*4; const rgb=mark?[230,240,255]:[20,90,195]; ico[offset]=rgb[2];ico[offset+1]=rgb[1];ico[offset+2]=rgb[0];ico[offset+3]=255; }
fs.writeFileSync('src-tauri/icons/icon.ico',ico);
