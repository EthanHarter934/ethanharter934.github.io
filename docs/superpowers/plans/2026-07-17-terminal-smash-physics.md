# Deeper Sounds, Physics World, and Terminal Smash Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deepen all non-chain sounds, unify throwable physics into a shared colliding world, and make the terminal smash the hero copy aside on first send.

**Architecture:** `sfx.js` gains deep variants (`uiClick`, `whomp`) and reworked `grab/thud/key/send`; the chain `click` is untouched. New `physicsWorld.js` singleton owns every free body in one rAF loop with AABB collisions, sleep states, drag, and a kinematic push edge. `Throwable.jsx` keeps its API but delegates simulation to the world and gains an imperative `launch()`. `Hero.jsx` orchestrates the smash; `Terminal.jsx` just reports sends via an `onSend` prop.

**Tech Stack:** React 19, Web Audio API, vanilla rAF physics. No new dependencies.

## Global Constraints

- Chain click sound unchanged (2400/1800Hz, full level).
- All sounds gesture-driven, synthesized, no-ops without AudioContext.
- Smash: first send per page load only; requires viewport ≥1024px and no `prefers-reduced-motion`; reload resets.
- One hitbox per hero-copy block; no per-word physics.
- Copy voice rules apply to any new text (there is none planned).
- Verify with `npm run build` + `npm run lint` in `frontend/` after each task (rolldown binding gotcha applies).
- Commit after every task.

---

### Task 1: Deeper sounds

**Files:**
- Modify: `frontend/src/utils/sfx.js`
- Modify: `frontend/src/components/Navbar.jsx`, `frontend/src/components/Hero.jsx`, `frontend/src/components/Footer.jsx` (call sites)

**Interfaces:**
- Produces: `uiClick()`, `whomp()` exports; reworked `grab/thud/key/send` (same signatures). `click(downstroke, level)` unchanged.

- [ ] **Step 1: Rework `sfx.js`**

Add a `delay` option to `mech` (start at `t + delay`, default 0) by changing its
signature line and every `t` usage to `t0 = t + delay`. Then replace the
non-chain sound functions:

```js
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

// quiet low keystroke tick, small random pitch, rate-limited
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
```

- [ ] **Step 2: Swap call sites**

In `Navbar.jsx`: import `uiClick` instead of `click`; `const uiClick = () => click(true, 0.35);` line is deleted (the import replaces it; keep the local name `uiClick` used in JSX).
In `Hero.jsx` and `Footer.jsx`: replace `import { click }` with `import { uiClick }` and every `click(true, 0.35)` call with `uiClick()`.

- [ ] **Step 3: Build, lint, commit**

Run in `frontend/`: `npm run build` and `npm run lint` — expect success.

```bash
git add frontend/src/utils/sfx.js frontend/src/components/Navbar.jsx frontend/src/components/Hero.jsx frontend/src/components/Footer.jsx
git commit -m "feat: deeper quieter sounds everywhere except the chain"
```

---

### Task 2: Shared physics world

**Files:**
- Create: `frontend/src/utils/physicsWorld.js`

**Interfaces:**
- Produces:
  - `addBody({ el, x, y, w, h, vx, vy }) → body` — body positions `el` via `translate3d`; `el` must already be `position: fixed; left: 0; top: 0`.
  - `removeBody(body)`
  - `beginDrag(body, clientX, clientY)`, `endDrag(body) → { vx, vy }` (drag move handled internally via window listeners)
  - `setEdge({ x, vx, top, bottom })`, `clearEdge()`
  - `onImpact(cb)` — `cb(speed)` on wall/floor/body impacts
  - Constants matching current Throwable feel: gravity 2900, restitution 0.3, edge 8px, ground friction 0.88, fling scale 0.75, max fling 1300.

- [ ] **Step 1: Write the module**

```js
// One shared physics world for every free-floating element on the page:
// thrown buttons, smashed hero pieces, whatever comes next. AABB bodies,
// gravity, viewport walls, body-vs-body collisions, and sleep states so the
// loop fully stops when everything settles.

const GRAVITY = 2900; // px/s^2
const RESTITUTION = 0.3;
const EDGE = 8;
const GROUND_FRICTION = 0.88;
const MAX_FLING = 1300; // px/s
const FLING_SCALE = 0.75;
const SLEEP_SPEED = 18; // px/s
const SLEEP_FRAMES = 14;
const SOLVER_PASSES = 3;

let bodies = [];
let raf = 0;
let last = 0;
let edge = null; // { x, vx, top, bottom }
let impactCb = null;
let dragBody = null;
let dragTarget = { x: 0, y: 0 };
let dragSamples = [];

export function onImpact(cb) {
  impactCb = cb;
}

function impact(speed) {
  if (impactCb) impactCb(speed);
}

function applyTransform(b) {
  if (b.el) b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
}

function wake(b) {
  b.sleeping = false;
  b.stillFrames = 0;
  startLoop();
}

export function addBody({ el, x, y, w, h, vx = 0, vy = 0 }) {
  const body = { el, x, y, w, h, vx, vy, sleeping: false, stillFrames: 0 };
  bodies.push(body);
  applyTransform(body);
  wake(body);
  return body;
}

export function removeBody(body) {
  bodies = bodies.filter((b) => b !== body);
  if (dragBody === body) dragBody = null;
}

export function setEdge(next) {
  edge = next;
  bodies.forEach(wake);
}

export function clearEdge() {
  edge = null;
}

// ── dragging ──────────────────────────────────────────────────────────────
function onDragMove(e) {
  if (!dragBody) return;
  dragTarget = { x: e.clientX - dragBody.grabDX, y: e.clientY - dragBody.grabDY };
  dragSamples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
  if (dragSamples.length > 6) dragSamples.shift();
}

function detachDragListeners() {
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onWindowUp);
  window.removeEventListener('pointercancel', onWindowUp);
}

function onWindowUp() {
  if (dragBody) endDrag(dragBody);
}

export function beginDrag(body, clientX, clientY) {
  dragBody = body;
  body.grabDX = clientX - body.x;
  body.grabDY = clientY - body.y;
  dragTarget = { x: body.x, y: body.y };
  dragSamples = [{ t: performance.now(), x: clientX, y: clientY }];
  wake(body);
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onWindowUp);
  window.addEventListener('pointercancel', onWindowUp);
}

export function endDrag(body) {
  if (dragBody !== body) return { vx: 0, vy: 0 };
  dragBody = null;
  detachDragListeners();
  const first = dragSamples[0];
  const lastS = dragSamples[dragSamples.length - 1];
  const dt = Math.max(((lastS?.t ?? 0) - (first?.t ?? 0)) / 1000, 0.016);
  const clamp = (v) => Math.max(-MAX_FLING, Math.min(MAX_FLING, v));
  body.vx = clamp((((lastS?.x ?? 0) - (first?.x ?? 0)) / dt) * FLING_SCALE);
  body.vy = clamp((((lastS?.y ?? 0) - (first?.y ?? 0)) / dt) * FLING_SCALE);
  wake(body);
  return { vx: body.vx, vy: body.vy };
}

// ── simulation ────────────────────────────────────────────────────────────
function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function resolvePair(a, b) {
  if (!overlaps(a, b)) return;
  const px = Math.min(a.x + a.w - b.x, b.x + b.w - a.x);
  const py = Math.min(a.y + a.h - b.y, b.y + b.h - a.y);
  const aKin = a === dragBody;
  const bKin = b === dragBody;
  if (a.sleeping && !b.sleeping) wake(a);
  if (b.sleeping && !a.sleeping) wake(b);

  if (px < py) {
    const dir = a.x + a.w / 2 < b.x + b.w / 2 ? -1 : 1;
    const aShare = aKin ? 0 : bKin ? 1 : 0.5;
    a.x += dir * px * aShare;
    b.x -= dir * px * (1 - aShare);
    const rel = a.vx - b.vx;
    if (rel * dir < 0) {
      const j = (-(1 + RESTITUTION) * rel) / 2;
      if (Math.abs(rel) > 120) impact(Math.abs(rel));
      if (!aKin) a.vx += j;
      if (!bKin) b.vx -= j;
    }
  } else {
    const dir = a.y + a.h / 2 < b.y + b.h / 2 ? -1 : 1;
    const aShare = aKin ? 0 : bKin ? 1 : 0.5;
    a.y += dir * py * aShare;
    b.y -= dir * py * (1 - aShare);
    const rel = a.vy - b.vy;
    if (rel * dir < 0) {
      const j = (-(1 + RESTITUTION) * rel) / 2;
      if (Math.abs(rel) > 120) impact(Math.abs(rel));
      if (!aKin) a.vy += j;
      if (!bKin) b.vy -= j;
    }
  }
}

function step(now) {
  const dt = Math.min((now - last) / 1000, 0.032);
  last = now;

  const floorFor = (b) => window.innerHeight - b.h - EDGE;
  const rightFor = (b) => window.innerWidth - b.w - EDGE;

  for (const b of bodies) {
    if (b === dragBody) {
      b.vx = (dragTarget.x - b.x) / Math.max(dt, 0.001);
      b.vy = (dragTarget.y - b.y) / Math.max(dt, 0.001);
      b.x = dragTarget.x;
      b.y = dragTarget.y;
      continue;
    }
    if (b.sleeping) continue;
    b.vy += GRAVITY * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }

  // the expanding terminal shoves bodies leftward
  if (edge) {
    for (const b of bodies) {
      const vOverlap = b.y + b.h > edge.top && b.y < edge.bottom;
      if (vOverlap && b.x + b.w > edge.x) {
        wake(b);
        b.x = edge.x - b.w;
        const push = Math.min(edge.vx, 0) * 1.2;
        if (b.vx > push) b.vx = push;
      }
    }
  }

  for (let pass = 0; pass < SOLVER_PASSES; pass += 1) {
    for (let i = 0; i < bodies.length; i += 1) {
      for (let j = i + 1; j < bodies.length; j += 1) {
        resolvePair(bodies[i], bodies[j]);
      }
    }
    for (const b of bodies) {
      if (b === dragBody) continue;
      const floor = floorFor(b);
      const right = rightFor(b);
      if (b.x < EDGE) {
        b.x = EDGE;
        if (b.vx < -120) impact(-b.vx);
        b.vx = -b.vx * RESTITUTION;
      } else if (b.x > right) {
        b.x = right;
        if (b.vx > 120) impact(b.vx);
        b.vx = -b.vx * RESTITUTION;
      }
      if (b.y >= floor) {
        b.y = floor;
        if (Math.abs(b.vy) > 220) {
          impact(Math.abs(b.vy));
          b.vy = -b.vy * RESTITUTION;
        } else {
          b.vy = 0;
        }
        b.vx *= GROUND_FRICTION;
      } else if (b.y < EDGE) {
        b.y = EDGE;
        b.vy = -b.vy * RESTITUTION;
      }
    }
  }

  let allAsleep = true;
  for (const b of bodies) {
    applyTransform(b);
    if (b === dragBody) {
      allAsleep = false;
      continue;
    }
    if (b.sleeping) continue;
    const speed = Math.hypot(b.vx, b.vy);
    if (speed < SLEEP_SPEED) {
      b.stillFrames += 1;
      if (b.stillFrames >= SLEEP_FRAMES) {
        b.sleeping = true;
        b.vx = 0;
        b.vy = 0;
        continue;
      }
    } else {
      b.stillFrames = 0;
    }
    allAsleep = false;
  }

  if (allAsleep && !edge && !dragBody) {
    raf = 0;
    return;
  }
  raf = requestAnimationFrame(step);
}

function startLoop() {
  if (raf) return;
  last = performance.now();
  raf = requestAnimationFrame(step);
}

// resting bodies follow the floor when the window resizes
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    for (const b of bodies) {
      b.x = Math.min(b.x, window.innerWidth - b.w - EDGE);
      b.y = Math.min(b.y, window.innerHeight - b.h - EDGE);
      applyTransform(b);
    }
  });
}
```

- [ ] **Step 2: Build (module compiles), commit**

Run in `frontend/`: `npm run build` — expect success (module not yet imported anywhere, that's fine).

```bash
git add frontend/src/utils/physicsWorld.js
git commit -m "feat: shared physics world with body collisions and sleep"
```

---

### Task 3: Throwable on the world + launch() + résumé link throwable

**Files:**
- Modify: `frontend/src/components/Throwable.jsx`
- Modify: `frontend/src/components/Hero.jsx` (wrap résumé link)

**Interfaces:**
- Consumes: `addBody`, `beginDrag`, `endDrag`, `onImpact` from `../utils/physicsWorld`; `grab`, `thud`, `ensureAudio` from `../utils/sfx`.
- Produces: `Throwable` still takes `{ children, hint }`; NEW: forwardRef imperative handle `launch(vx, vy)` that frees the element with an initial velocity (used by the smash). World impacts play `thud` (wired once here via `onImpact(thud)`).

- [ ] **Step 1: Rewrite Throwable simulation on the world**

Keep: hint logic, placeholder span, `DRAG_THRESHOLD`, suppressClick capture, reduce check, `onDragStart` preventDefault. Remove: local GRAVITY/RESTITUTION/etc constants, `startLoop`/`stopLoop`, local samples, local resize effect (world handles), local bounce logic. Core changes:

```jsx
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { addBody, beginDrag, endDrag, onImpact } from '../utils/physicsWorld';
import { ensureAudio, grab, thud } from '../utils/sfx';

onImpact(thud); // world impacts sound like weight (module-level, set once)
```

Component becomes `forwardRef(function Throwable({ children, hint }, ref) { ... })`.

State refs: `phys = useRef({ body: null, dragging: false, started: false, free: false, startX: 0, startY: 0, suppressClick: false, reduce: false })`.

Free helper (measure + register):

```jsx
  const freeUp = (vx = 0, vy = 0) => {
    const p = phys.current;
    if (p.free) {
      if (p.body) {
        p.body.vx = vx;
        p.body.vy = vy;
        p.body.sleeping = false;
        p.body.stillFrames = 0;
      }
      return p.body;
    }
    const el = bodyRef.current;
    const rect = el.getBoundingClientRect();
    setSize({ w: rect.width, h: rect.height });
    p.free = true;
    setFree(true);
    p.body = addBody({ el, x: rect.left, y: rect.top, w: rect.width, h: rect.height, vx, vy });
    return p.body;
  };

  useImperativeHandle(ref, () => ({
    launch(vx, vy) {
      if (phys.current.reduce) return;
      if (hint) dismissHint();
      freeUp(vx, vy);
    },
  }));
```

`onPointerDown`: same guards; store startX/startY; `ensureAudio()`.
Window move handler: when threshold crossed the first time → `grab()`, dismiss hint, `const body = freeUp(0, 0); beginDrag(body, event.clientX, event.clientY); p.suppressClick = true;`. (World's own window listeners then track the drag; this component's move handler only does threshold detection, so once started it does nothing more.)
Window up handler: if started → `endDrag(phys.current.body)`; reset `dragging/started`.
The element's free style stays: `{ position: 'fixed', left: 0, top: 0, zIndex: 400, cursor: 'grab' }`.
On unmount, do NOT remove the body if free (thrown buttons persist for the page) — actually the component stays mounted for the page's life; keep `removeBody` out.

- [ ] **Step 2: Wrap the résumé link in Hero**

```jsx
              <Throwable>
                <a
                  href="/CS_AI Resume.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-quiet link-sweep"
                  onClick={() => uiClick()}
                >
                  résumé ↗
                </a>
              </Throwable>
```

- [ ] **Step 3: Build, lint, manual parity check, commit**

`npm run build` + `npm run lint`. Then quick Playwright check: throw the hero CTA — it must still fly, bounce, land, and remain clickable; throw the second button onto it — they must not overlap at rest.

```bash
git add frontend/src/components/Throwable.jsx frontend/src/components/Hero.jsx
git commit -m "refactor: throwables ride the shared physics world and collide"
```

---

### Task 4: Terminal smash-expand

**Files:**
- Modify: `frontend/src/components/Terminal.jsx` (add `onSend` prop)
- Modify: `frontend/src/components/Hero.jsx` (orchestration)
- Modify: `frontend/src/styles/global.css` (grid transition, squash pulse, smashed piece styling)

**Interfaces:**
- Consumes: `addBody`, `beginDrag`, `setEdge`, `clearEdge` from physicsWorld; `whomp`, `grab` from sfx; Throwable `launch(vx, vy)` refs.
- Produces: `Terminal({ onSend })`; `.hero-inner.term-expanded` CSS state.

- [ ] **Step 1: Terminal reports sends**

`export default function Terminal({ onSend })`; in `handleSend` after the guard (next to `sendSfx()`): `onSend?.();`.

- [ ] **Step 2: Hero orchestration**

Add refs: `heroInnerRef` on `.hero-inner`, `copyRef` on `.hero-copy`, `termRef` on the `.hero-terminal` Reveal (Reveal spreads `...rest` onto motion.div — pass `ref` via a wrapper: motion.div accepts ref through Reveal only if forwarded; Reveal does NOT forward refs, so instead select by class inside `heroInnerRef`: `heroInnerRef.current.querySelector('.hero-terminal')`). Add state `smashed` + `setSmashed`.

```jsx
  const smashedRef = useRef(false);
  const [smashed, setSmashed] = useState(false);
  const heroInnerRef = useRef(null);
  const primaryCtaRef = useRef(null);
  const resumeRef = useRef(null);

  const handleTerminalSend = () => {
    if (smashedRef.current) return;
    if (window.innerWidth < 1024) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    smashedRef.current = true;

    const inner = heroInnerRef.current;
    const copy = inner?.querySelector('.hero-copy');
    const term = inner?.querySelector('.hero-terminal');
    if (!inner || !copy || !term) return;

    // one hitbox per copy block; buttons launch through their own physics
    const pieces = ['.hero-eyebrow', '.hero-title', '.hero-lede', '.hero-meta']
      .map((sel) => copy.querySelector(sel))
      .filter(Boolean);

    whomp();

    for (const el of pieces) {
      const rect = el.getBoundingClientRect();
      el.style.width = `${rect.width}px`;
      el.style.margin = '0';
      el.style.position = 'fixed';
      el.style.left = '0';
      el.style.top = '0';
      el.style.zIndex = 390;
      el.classList.add('smashed-piece');
      const body = addBody({ el, x: rect.left, y: rect.top, w: rect.width, h: rect.height, vx: -80, vy: -60 });
      el.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        ensureAudio();
        grab();
        beginDrag(body, e.clientX, e.clientY);
      });
    }

    primaryCtaRef.current?.launch(-260, -120);
    resumeRef.current?.launch(-200, -160);

    setSmashed(true);

    // the expanding terminal is a moving wall while the grid animates
    let prevLeft = term.getBoundingClientRect().left;
    let prevT = performance.now();
    let raf = 0;
    const track = (now) => {
      const rect = term.getBoundingClientRect();
      const dt = Math.max((now - prevT) / 1000, 0.001);
      const vx = (rect.left - prevLeft) / dt;
      setEdge({ x: rect.left, vx, top: rect.top, bottom: rect.bottom });
      prevLeft = rect.left;
      prevT = now;
      raf = requestAnimationFrame(track);
    };
    raf = requestAnimationFrame(track);
    setTimeout(() => {
      cancelAnimationFrame(raf);
      clearEdge();
    }, 950);
  };
```

Imports in Hero: `addBody, beginDrag, setEdge, clearEdge` from physicsWorld; `ensureAudio, grab, uiClick, whomp` from sfx; `useRef, useState` from react.
JSX: `.hero-inner` gets `ref={heroInnerRef}` and `className={`hero-inner container ${smashed ? 'term-expanded' : ''}`}`; the two Throwables get `ref={primaryCtaRef}` / `ref={resumeRef}`; `<Terminal onSend={handleTerminalSend} />`.

- [ ] **Step 3: CSS**

In the hero section of `global.css` (near `.hero-inner`):

```css
.hero-inner {
  transition: grid-template-columns 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.hero-inner.term-expanded {
  grid-template-columns: 0fr 1fr;
}

.hero-inner.term-expanded .hero-copy {
  min-width: 0;
  overflow: hidden;
}

.hero-inner.term-expanded .hero-terminal .term {
  animation: term-stretch 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: right center;
}

@keyframes term-stretch {
  0% { transform: scaleX(1); }
  35% { transform: scaleX(1.05); }
  65% { transform: scaleX(0.98); }
  100% { transform: scaleX(1); }
}

.smashed-piece {
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
}
```

(Check the existing `.hero-inner` rule for its `grid-template-columns` value; the transition interpolates fr values in all current browsers.)

- [ ] **Step 4: Build, lint, commit**

`npm run build` + `npm run lint`.

```bash
git add frontend/src/components/Terminal.jsx frontend/src/components/Hero.jsx frontend/src/styles/global.css
git commit -m "feat: terminal smash-expands the hero on first send"
```

---

### Task 5: End-to-end verification

**Files:** none

- [ ] **Step 1: Desktop Playwright pass**

Dev server + Playwright at 1440×900:
- Send a chat message (type + Enter). Confirm: `.hero-inner` has `term-expanded`; terminal width grows; the four copy pieces become `position: fixed` and end up left of the terminal's left edge; after ~3s all pieces rest in the viewport with no pairwise AABB overlaps (tolerance 2px); both CTA buttons are on the floor too.
- Drag a resting piece and fling it onto the pile: pieces push apart, none overlap at rest.
- Throw both hero buttons pre-smash (reload first): parity with old behavior, land, clickable, no overlap.
- Second send: nothing new happens (no errors, still expanded).
- Reload: hero copy restored, terminal compact, messages still in the log.
- Zero console errors throughout.

- [ ] **Step 2: Mobile + reduced-motion pass**

- 390×844: send a message → no `term-expanded` class, no fixed pieces, no errors.
- Desktop with `page.emulateMedia({ reducedMotion: 'reduce' })` + reload: send → no smash, no errors.

- [ ] **Step 3: Build + lint final, update memory, report**

`npm run build`, `npm run lint`. Update the portfolio-redesign memory with the physics world architecture. Report results.
