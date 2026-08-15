/**
 * Generates the placeholder media, with no ffmpeg and no dependencies:
 *
 *   client/public/audio/ambient.wav   8s wind + drone bed, loop-safe
 *   client/public/audio/click.wav     70ms UI tick
 *   client/public/media/bg.svg        dusk ridge backdrop
 *
 * All three are meant to be replaced. Drop an `ambient.mp3` / `click.mp3` next
 * to the .wav files, or a `bg.jpg` next to the .svg, and yours wins — see the
 * README. Run with: npm run media
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const audioDir = path.join(root, 'client', 'public', 'audio');
const mediaDir = path.join(root, 'client', 'public', 'media');

const RATE = 16000; // plenty for a blurred ambient bed, and a quarter the bytes

/** Scale so the loudest sample lands at `peak` — no clipping, no guesswork. */
function normalize(samples, peak = 0.72) {
  let max = 0;
  for (const s of samples) max = Math.max(max, Math.abs(s));
  if (max === 0) return samples;
  const gain = peak / max;
  for (let i = 0; i < samples.length; i++) samples[i] *= gain;
  return samples;
}

/** Float samples in -1..1 → a mono 16-bit PCM .wav file. */
function writeWav(file, samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(clamped * 32767), i * 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // format: PCM
  header.writeUInt16LE(1, 22); // channels: mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);

  fs.writeFileSync(file, Buffer.concat([header, data]));
  return data.length + 44;
}

/**
 * Wind is filtered noise; the weight under it is two detuned sines an octave
 * apart. The whole 8s is crossfaded end-to-start so the loop has no seam.
 */
function ambient(seconds = 8) {
  const n = Math.floor(RATE * seconds);
  const out = new Float32Array(n);

  let lp1 = 0;
  let lp2 = 0;

  for (let i = 0; i < n; i++) {
    const t = i / RATE;

    // two-pole lowpass over white noise → a soft wind bed
    const noise = Math.random() * 2 - 1;
    lp1 += (noise - lp1) * 0.02;
    lp2 += (lp1 - lp2) * 0.02;

    // slow swell, so it breathes instead of sitting flat
    const swell = 0.55 + 0.45 * Math.sin((2 * Math.PI * t) / seconds);

    const drone =
      0.16 * Math.sin(2 * Math.PI * 55 * t) + // whole cycles in 8s: no click at the loop
      0.09 * Math.sin(2 * Math.PI * 110.25 * t) +
      0.05 * Math.sin(2 * Math.PI * 82.5 * t);

    out[i] = lp2 * 7.5 * swell + drone * swell;
  }

  // crossfade the tail over the head so looping is seamless
  const fade = Math.floor(RATE * 0.6);
  for (let i = 0; i < fade; i++) {
    const k = i / fade;
    out[i] = out[i] * k + out[n - fade + i] * (1 - k);
  }

  return normalize(out.subarray(0, n - fade), 0.55);
}

/** A short filtered blip — a UI tick, not a beep. */
function click() {
  const n = Math.floor(RATE * 0.07);
  const out = new Float32Array(n);
  let lp = 0;

  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const decay = Math.exp(-t * 90);
    const body = Math.sin(2 * Math.PI * 780 * t) * 0.6 + Math.sin(2 * Math.PI * 1560 * t) * 0.25;
    const grit = (Math.random() * 2 - 1) * 0.35;
    lp += (body + grit - lp) * 0.55;
    out[i] = lp * decay;
  }

  return normalize(out, 0.75);
}

/**
 * Original artwork: a dusk ridge line. It sits behind a heavy blur, so shape
 * and colour are all that survive — which is the point of it being an SVG.
 */
const BACKDROP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a0c0e"/>
      <stop offset="38%" stop-color="#2a1a12"/>
      <stop offset="63%" stop-color="#8a3d12"/>
      <stop offset="78%" stop-color="#d8631a"/>
      <stop offset="100%" stop-color="#2a1508"/>
    </linearGradient>
    <radialGradient id="sun" cx="62%" cy="72%" r="26%">
      <stop offset="0%" stop-color="#ffd9a0" stop-opacity="0.95"/>
      <stop offset="55%" stop-color="#ff8a1e" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#ff6b1a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1600" height="900" fill="url(#sky)"/>
  <rect width="1600" height="900" fill="url(#sun)"/>

  <!-- far ridge -->
  <path d="M0 690 L180 636 L330 668 L520 596 L700 650 L900 590 L1080 646 L1290 604 L1450 652 L1600 618 L1600 900 L0 900 Z"
        fill="#1a1207" opacity="0.85"/>
  <!-- near ridge -->
  <path d="M0 782 L220 724 L420 768 L640 706 L860 760 L1090 712 L1320 764 L1600 720 L1600 900 L0 900 Z"
        fill="#0d0a06"/>
  <!-- foreground -->
  <path d="M0 860 L300 828 L620 864 L980 826 L1340 862 L1600 832 L1600 900 L0 900 Z" fill="#07080a"/>
</svg>
`;

fs.mkdirSync(audioDir, { recursive: true });
fs.mkdirSync(mediaDir, { recursive: true });

const written = [
  ['audio/ambient.wav', writeWav(path.join(audioDir, 'ambient.wav'), ambient())],
  ['audio/click.wav', writeWav(path.join(audioDir, 'click.wav'), click())],
];

fs.writeFileSync(path.join(mediaDir, 'bg.svg'), BACKDROP_SVG);
written.push(['media/bg.svg', Buffer.byteLength(BACKDROP_SVG)]);

for (const [name, bytes] of written) {
  console.log(`[media] ${name.padEnd(20)} ${(bytes / 1024).toFixed(1)} KB`);
}
console.log('[media] placeholders written — replace them with your own files, see README');
