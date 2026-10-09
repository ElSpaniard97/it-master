// Short synthesized sound effects. No audio files; the context starts on the first click.
const KEY = 'it-master-sound';
let ctx = null,
  enabled = true;
try {
  enabled = localStorage.getItem(KEY) !== 'off';
} catch {}

export const soundOn = () => enabled;
export function setSound(on) {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {}
}

// Each effect is a list of [frequency Hz, start s, length s] notes.
const effects = {
  select: [[660, 0, 0.05]],
  connect: [
    [520, 0, 0.07],
    [780, 0.06, 0.09],
  ],
  error: [
    [180, 0, 0.12],
    [140, 0.1, 0.16],
  ],
  online: [
    [660, 0, 0.08],
    [880, 0.08, 0.08],
    [1100, 0.16, 0.14],
  ],
  complete: [
    [523, 0, 0.12],
    [659, 0.12, 0.12],
    [784, 0.24, 0.12],
    [1047, 0.36, 0.3],
  ],
};

export function play(name) {
  if (!enabled || !effects[name]) return;
  try {
    ctx ||= new AudioContext();
    const now = ctx.currentTime;
    for (const [freq, at, len] of effects[name]) {
      const osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.type = name === 'error' ? 'square' : 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + at);
      gain.gain.exponentialRampToValueAtTime(0.12, now + at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + len);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + at);
      osc.stop(now + at + len + 0.02);
    }
  } catch {}
}
