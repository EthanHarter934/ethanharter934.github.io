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
function mech({ freq, q = 1.1, noiseGain, noiseDur = 0.045, thumpFreq = 0, thumpGain = 0, thumpDur = 0.06 }) {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;

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

// soft tick when a throwable gets picked up
export function grab() {
  mech({ freq: 1500, noiseGain: 0.16, noiseDur: 0.03, thumpFreq: 120, thumpGain: 0.05, thumpDur: 0.04 });
}

// impact thump for throwable bounces; velocity in px/s.
// quiet settle bounces stay silent, and impacts are rate-limited.
let lastThud = 0;
export function thud(velocity) {
  const speed = Math.abs(velocity);
  if (speed < 260) return;
  const now = performance.now();
  if (now - lastThud < 70) return;
  lastThud = now;
  const punch = Math.min(1, speed / 1600);
  mech({
    freq: 900 + punch * 500,
    q: 0.9,
    noiseGain: 0.1 + punch * 0.3,
    noiseDur: 0.05,
    thumpFreq: 110 + punch * 70,
    thumpGain: 0.08 + punch * 0.18,
    thumpDur: 0.07,
  });
}

// very quiet keystroke tick with a little random pitch so typing
// doesn't sound like a machine gun; rate-limited for key repeat
let lastKey = 0;
export function key() {
  const now = performance.now();
  if (now - lastKey < 34) return;
  lastKey = now;
  mech({ freq: 2100 + Math.random() * 700, q: 1.4, noiseGain: 0.06, noiseDur: 0.025 });
}

// brighter little click for sending a chat message
export function send() {
  mech({ freq: 2800, noiseGain: 0.2, noiseDur: 0.04, thumpFreq: 200, thumpGain: 0.06, thumpDur: 0.05 });
}
