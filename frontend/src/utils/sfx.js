// Shared Web Audio sound kit. Every sound is synthesized on the fly in
// the pull chain's sonic family (filtered-noise tick + low sine thump);
// no audio files. All functions are safe no-ops when audio is unavailable,
// and everything fires from user gestures so autoplay policy never bites.

let ctx = null;

function getCtx() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      ctx = null;
    }
  }
  if (ctx?.state === 'suspended') ctx.resume();
  return ctx;
}

// one mechanical sound: a bandpassed noise burst plus a pitched-down thump
function mech({ freq, q = 1.1, noiseGain, noiseDur = 0.045, thumpFreq = 0, thumpGain = 0, thumpDur = 0.06, delay = 0 }) {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + delay;

  if (noiseGain > 0) {
    const len = Math.floor(c.sampleRate * 0.012);
    const buffer = c.createBuffer(1, len, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
    }
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    const band = c.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = freq;
    band.Q.value = q;
    const gain = c.createGain();
    gain.gain.setValueAtTime(noiseGain, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + noiseDur);
    noise.connect(band);
    band.connect(gain);
    gain.connect(c.destination);
    noise.start(t);
  }

  if (thumpGain > 0) {
    const thump = c.createOscillator();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(thumpFreq, t);
    thump.frequency.exponentialRampToValueAtTime(65, t + thumpDur * 0.75);
    const gain = c.createGain();
    gain.gain.setValueAtTime(thumpGain, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + thumpDur);
    thump.connect(gain);
    gain.connect(c.destination);
    thump.start(t);
    thump.stop(t + thumpDur + 0.01);
  }
}

// warm the context up inside a user gesture (pointerdown) so the first
// real sound doesn't get eaten by a suspended context
export function ensureAudio() {
  return getCtx();
}

// the chain "tk": downstroke = switch engaging, release = snap home.
// level scales the whole thing down for quieter UI clicks.
export function click(downstroke = true, level = 1) {
  mech({
    freq: downstroke ? 2400 : 1800,
    noiseGain: (downstroke ? 0.55 : 0.32) * level,
    thumpFreq: downstroke ? 180 : 140,
    thumpGain: (downstroke ? 0.16 : 0.1) * level,
  });
}

// deep quiet click for regular UI (nav links, buttons): thocky, not ticky
export function uiClick() {
  mech({ freq: 700, q: 0.9, noiseGain: 0.22, noiseDur: 0.04, thumpFreq: 100, thumpGain: 0.1, thumpDur: 0.055 });
}

// soft low tick when something gets picked up
export function grab() {
  mech({ freq: 600, q: 0.9, noiseGain: 0.16, noiseDur: 0.035, thumpFreq: 95, thumpGain: 0.07, thumpDur: 0.05 });
}

// impact for physics bodies; velocity in px/s. Thump-first so it reads as
// weight, not a click. Silent below threshold, rate-limited.
let lastThud = 0;
export function thud(velocity) {
  const speed = Math.abs(velocity);
  if (speed < 260) return;
  const now = performance.now();
  if (now - lastThud < 70) return;
  lastThud = now;
  const punch = Math.min(1, speed / 1600);
  mech({
    freq: 400,
    q: 0.7,
    noiseGain: 0.04 + punch * 0.12,
    noiseDur: 0.06,
    thumpFreq: 70 + punch * 70,
    thumpGain: 0.12 + punch * 0.26,
    thumpDur: 0.09,
  });
}

// quiet low keystroke tick with a little random pitch so typing
// doesn't sound like a machine gun; rate-limited for key repeat
let lastKey = 0;
export function key() {
  const now = performance.now();
  if (now - lastKey < 34) return;
  lastKey = now;
  mech({ freq: 1000 + Math.random() * 400, q: 1.2, noiseGain: 0.06, noiseDur: 0.03 });
}

// deep double-thock for sending a chat message
export function send() {
  mech({ freq: 650, q: 0.9, noiseGain: 0.18, noiseDur: 0.04, thumpFreq: 130, thumpGain: 0.1, thumpDur: 0.06 });
  mech({ freq: 500, q: 0.9, noiseGain: 0.12, noiseDur: 0.045, thumpFreq: 110, thumpGain: 0.08, thumpDur: 0.07, delay: 0.06 });
}

// big soft whomp for the terminal expansion: low sweep + rumble
export function whomp() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.35);
  const og = c.createGain();
  og.gain.setValueAtTime(0.28, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  osc.connect(og);
  og.connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.42);

  const len = Math.floor(c.sampleRate * 0.3);
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 300;
  const ng = c.createGain();
  ng.gain.setValueAtTime(0.12, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  noise.connect(lp);
  lp.connect(ng);
  ng.connect(c.destination);
  noise.start(t);
}
