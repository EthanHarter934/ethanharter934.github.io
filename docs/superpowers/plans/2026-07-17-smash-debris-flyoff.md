# Smash Debris Fly-Off Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Smashed hero text and the two launched CTA buttons fly straight off the left edge of the screen and vanish, instead of colliding with the expanding terminal and settling into a floor pile.

**Architecture:** `physicsWorld.js` gains an `exit` body flag: exit bodies keep the existing gravity/rotation integration but skip all collision (wall, floor, body-vs-body) and the sleep system, and remove themselves once fully past the left edge. The terminal "kinematic edge" wall (`setEdge`/`clearEdge`) is deleted along with the per-frame rAF loop in `Hero.jsx` that fed it. `Throwable.jsx` gains a `vanish(vx, vy)` imperative method (sibling to the existing `launch`) that registers an exit body instead of a normal persistent one, and stops the button from being grabbed while exiting. Because exit bodies can empty out of the physics world while the hero is still visually collapsed, `Hero.jsx` broadcasts its own "smashed" boolean via a small custom event (`eh:hero-smash-state`) that `ResetPhysics.jsx` also checks, so the reset button doesn't disappear before the user has a chance to use it.

**Tech Stack:** unchanged (React 19, vanilla rAF physics, Web Audio). No test runner in this repo — verification is `npm run build` + `npm run lint` plus manual Playwright passes, matching the existing plans in this directory.

## Global Constraints

- Reset must still restore the exact pre-smash DOM state (same style-property removal list as today).
- No em dashes in any copy.
- Build + lint after each task; commit each task.
- Manual dragging/throwing a CTA button outside of a smash (the independent "throw me" feature) must be completely unaffected.

---

### Task 1: `exit` body support in the physics world

**Files:** Modify `frontend/src/utils/physicsWorld.js`

- [ ] Remove the module-level `let edge = null;` declaration and the exported `setEdge`/`clearEdge` functions entirely.
- [ ] `addBody`: accept a new `exit = false` option and store it on the body (drop the now-unused `edgeTouched: false` field, since it existed only for the edge wall). Signature becomes:

```js
export function addBody({ el, x, y, w, h, vx = 0, vy = 0, va = 0, exit = false }) {
  const body = {
    el,
    x,
    y,
    w,
    h,
    vx,
    vy,
    angle: 0,
    va,
    exit,
    sleeping: false,
    stillFrames: 0,
  };
  if (el) el.style.transformOrigin = '50% 50%';
  bodies.push(body);
  applyTransform(body);
  wake(body);
  changeCb?.(bodies.length);
  return body;
}
```

- [ ] In `step()`, delete the whole "the expanding terminal shoves bodies leftward" block (the `if (edge) { ... }` section that referenced `edge`).
- [ ] In the solver-pass loop, skip pairwise collision when either body is exiting:

```js
    for (let i = 0; i < bodies.length; i += 1) {
      for (let j = i + 1; j < bodies.length; j += 1) {
        if (bodies[i].exit || bodies[j].exit) continue;
        resolvePair(bodies[i], bodies[j]);
      }
    }
```

- [ ] In the same pass's wall/floor loop, skip exit bodies entirely (they pass through walls and the floor):

```js
    for (const b of bodies) {
      if (b === dragBody || b.exit) continue;
      const floor = window.innerHeight - b.h - EDGE;
      const right = window.innerWidth - b.w - EDGE;
      if (b.x < EDGE) {
        b.x = EDGE;
        if (b.vx < -120) impact(-b.vx);
        b.vx = -b.vx * RESTITUTION;
        b.va += b.vy * 0.0018;
      } else if (b.x > right) {
        b.x = right;
        if (b.vx > 120) impact(b.vx);
        b.vx = -b.vx * RESTITUTION;
        b.va -= b.vy * 0.0018;
      }
      if (b.y >= floor) {
        b.y = floor;
        if (Math.abs(b.vy) > 220) {
          impact(Math.abs(b.vy));
          b.vy = -b.vy * RESTITUTION;
          b.va += b.vx * 0.0018;
        } else {
          b.vy = 0;
          b.va *= 0.85;
          b.angle *= 0.96;
        }
        b.vx *= GROUND_FRICTION;
      } else if (b.y < EDGE) {
        b.y = EDGE;
        b.vy = -b.vy * RESTITUTION;
      }
    }
```

- [ ] Replace the final "apply transforms / sleep" loop so exit bodies never sleep and instead get queued for removal once they've cleared the left edge:

```js
  const toRemove = [];
  let allAsleep = true;
  for (const b of bodies) {
    applyTransform(b);
    if (b === dragBody) {
      allAsleep = false;
      continue;
    }
    if (b.exit) {
      if (b.x + b.w < -40) toRemove.push(b);
      allAsleep = false;
      continue;
    }
    if (b.sleeping) continue;
    const speed = Math.hypot(b.vx, b.vy);
    if (speed < SLEEP_SPEED) {
      b.va *= 0.8;
      b.angle *= 0.9;
      b.stillFrames += 1;
      if (b.stillFrames >= SLEEP_FRAMES) {
        b.sleeping = true;
        b.vx = 0;
        b.vy = 0;
        b.va = 0;
        continue;
      }
    } else {
      b.stillFrames = 0;
    }
    allAsleep = false;
  }
  for (const b of toRemove) removeBody(b);

  if (allAsleep && !dragBody) {
    raf = 0;
    return;
  }
  raf = requestAnimationFrame(step);
```

  (Note the loop-end condition drops `!edge` since `edge` no longer exists.)

- [ ] Run `npm run build` and `npm run lint` from `frontend/`. Expected: both succeed with no errors (there will still be unused-import warnings from `Hero.jsx` until Task 3 — ignore those for now).
- [ ] Commit:

```bash
git add frontend/src/utils/physicsWorld.js
git commit -m "feat: exit bodies pass through everything and self-remove offscreen"
```

### Task 2: `vanish()` on Throwable

**Files:** Modify `frontend/src/components/Throwable.jsx`

**Interfaces:**
- Consumes: `addBody({ el, x, y, w, h, vx, vy, exit })` from `../utils/physicsWorld` (Task 1's new `exit` option).
- Produces: `ref.vanish(vx, vy)` — a new imperative method on the `Throwable` ref, alongside the existing `ref.launch(vx, vy)`. Same signature as `launch`, but the button becomes ungrabbable and is registered as an exit body instead of a normal free body.

- [ ] Add `exiting: false` to the `phys` ref's initial object (next to `dragging`, `started`, `free`, etc.).
- [ ] Change `freeUp` to take a third `exit` parameter and forward it to `addBody`:

```js
  const freeUp = (vx = 0, vy = 0, exit = false) => {
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
    p.body = addBody({ el, x: rect.left, y: rect.top, w: rect.width, h: rect.height, vx, vy, exit });
    return p.body;
  };
```

- [ ] Add `vanish` next to `launch` in the imperative handle:

```js
  useImperativeHandle(ref, () => ({
    launch(vx, vy) {
      if (phys.current.reduce) return;
      if (hint) dismissHint();
      freeUp(vx, vy);
    },
    vanish(vx, vy) {
      if (phys.current.reduce) return;
      if (hint) dismissHint();
      phys.current.exiting = true;
      freeUp(vx, vy, true);
    },
  }));
```

- [ ] Guard `onPointerDown` so an exiting button can't be grabbed:

```js
  const onPointerDown = (event) => {
    const p = phys.current;
    if (p.reduce || p.exiting) return;
    if (event.button !== 0) return;
    event.preventDefault();
    p.dragging = true;
    p.started = false;
    p.suppressClick = false;
    p.startX = event.clientX;
    p.startY = event.clientY;
    ensureAudio();
  };
```

- [ ] Clear the new flag in the reset handler, alongside the existing fields:

```js
  useEffect(() => {
    const onReset = () => {
      const p = phys.current;
      if (!p.free) return;
      if (p.body) removeBody(p.body);
      p.body = null;
      p.free = false;
      p.exiting = false;
      p.dragging = false;
      p.started = false;
      const el = bodyRef.current;
      if (el) el.style.transform = '';
      setFree(false);
    };
    window.addEventListener('eh:physics-reset', onReset);
    return () => window.removeEventListener('eh:physics-reset', onReset);
  }, []);
```

- [ ] In the render, don't show a `grab` cursor on a button that can't be grabbed:

```jsx
          ...(free
            ? { position: 'fixed', left: 0, top: 0, zIndex: 400, cursor: phys.current.exiting ? 'default' : 'grab' }
            : { position: 'relative' }),
```

- [ ] Run `npm run build` and `npm run lint` from `frontend/`. Expected: both succeed.
- [ ] Manual smoke check: this task alone doesn't change any call site yet (`Hero.jsx` still calls `.launch`), so the page's existing smash-into-a-pile behavior is unchanged at this point. Confirm the dev server still starts and the hero renders normally before moving on.
- [ ] Commit:

```bash
git add frontend/src/components/Throwable.jsx
git commit -m "feat: Throwable gains a vanish() mode that exits instead of piling up"
```

### Task 3: Hero smash uses exit bodies, drops the edge tracker

**Files:** Modify `frontend/src/components/Hero.jsx`

**Interfaces:**
- Consumes: `addBody({ ..., exit: true })` (Task 1), `ref.vanish(vx, vy)` on `primaryCtaRef`/`resumeRef` (Task 2).
- Produces: dispatches `window` event `eh:hero-smash-state` with `{ detail: boolean }` — `true` right when a smash starts, `false` inside the reset handler. Task 4 consumes this event.

- [ ] Update the import line to drop what's no longer used and keep what still is:

```js
import { addBody, removeBody } from '../utils/physicsWorld';
```

- [ ] Update the sfx import to drop `ensureAudio` and `grab` (only needed by the per-piece drag handler being removed):

```js
import { uiClick, whomp } from '../utils/sfx';
```

- [ ] Replace the `eh:physics-reset` listener's body — drop the `cleanup.abort.abort()` call (no more AbortController) and the `clearEdge()` call, and broadcast the new smash-state event:

```jsx
  useEffect(() => {
    const onReset = () => {
      const cleanup = smashCleanupRef.current;
      if (cleanup) {
        cleanup.bodies.forEach(removeBody);
        for (const el of cleanup.pieces) {
          for (const prop of [
            'width',
            'margin',
            'position',
            'left',
            'top',
            'z-index',
            'transform',
            'transform-origin',
          ]) {
            el.style.removeProperty(prop);
          }
          el.classList.remove('smashed-piece');
        }
        for (const el of cleanup.drops) el.classList.remove('word-fade');
        smashCleanupRef.current = null;
      }
      smashedRef.current = false;
      setSmashed(false);
      window.dispatchEvent(new CustomEvent('eh:hero-smash-state', { detail: false }));
    };
    window.addEventListener('eh:physics-reset', onReset);
    return () => window.removeEventListener('eh:physics-reset', onReset);
  }, []);
```

- [ ] Replace `handleTerminalSend` in full:

```js
  const handleTerminalSend = () => {
    if (smashedRef.current) return;
    if (window.innerWidth < 1024) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const inner = heroInnerRef.current;
    const copy = inner?.querySelector('.hero-copy');
    const term = inner?.querySelector('.hero-terminal');
    if (!inner || !copy || !term) return;
    smashedRef.current = true;

    const pieces = [...copy.querySelectorAll('[data-smash="chunk"]')];
    const drops = [...copy.querySelectorAll('[data-smash="drop"]')];
    const rects = pieces.map((el) => el.getBoundingClientRect());

    whomp();
    window.dispatchEvent(new CustomEvent('eh:hero-smash-state', { detail: true }));

    for (const el of drops) el.classList.add('word-fade');

    const cleanup = { pieces, drops, bodies: [] };
    smashCleanupRef.current = cleanup;

    pieces.forEach((el, i) => {
      const rect = rects[i];
      el.style.width = `${rect.width}px`;
      el.style.margin = '0';
      el.style.position = 'fixed';
      el.style.left = '0';
      el.style.top = '0';
      el.style.zIndex = 15;
      el.classList.add('smashed-piece');
      const body = addBody({
        el,
        x: rect.left,
        y: rect.top,
        w: rect.width,
        h: rect.height,
        vx: -900 - Math.random() * 400,
        vy: -80 + Math.random() * 160,
        va: (Math.random() - 0.5) * 3,
        exit: true,
      });
      cleanup.bodies.push(body);
    });

    primaryCtaRef.current?.vanish(-1000 - Math.random() * 300, -60);
    resumeRef.current?.vanish(-1000 - Math.random() * 300, 60);

    setSmashed(true);
  };
```

  This deletes the old `track()` rAF loop, the `transitionend`/`stopEdge`/`fallback` machinery, and the per-piece `pointerdown` → `beginDrag` listener block — none of it is needed anymore.

- [ ] Run `npm run build` and `npm run lint` from `frontend/`. Expected: both succeed with zero warnings now (the Task 1 unused-import warnings are gone since the imports were cleaned up here).
- [ ] Commit:

```bash
git add frontend/src/components/Hero.jsx
git commit -m "feat: smash launches text and CTA buttons as exit bodies, not a wall-and-pile"
```

### Task 4: Reset button stays visible through the whole smashed state

**Files:** Modify `frontend/src/components/ResetPhysics.jsx`

**Interfaces:**
- Consumes: `eh:hero-smash-state` custom event (Task 3), `onBodiesChange(cb)` from `../utils/physicsWorld` (unchanged, pre-existing).

- [ ] Replace the component body to track both the physics world's body count and the hero's own smashed flag, showing the button if either is true:

```jsx
import { useEffect, useState } from 'react';
import { onBodiesChange } from '../utils/physicsWorld';
import { uiClick } from '../utils/sfx';

// Subtle bottom-right button that puts every thrown button and smashed
// hero piece back where it started. Rendered whenever the physics world
// has something to reset, or the hero is mid-smash (its debris may have
// already flown off and been removed before the button is clicked).
export default function ResetPhysics() {
  const [bodyCount, setBodyCount] = useState(0);
  const [smashed, setSmashed] = useState(false);

  useEffect(() => onBodiesChange(setBodyCount), []);

  useEffect(() => {
    const onSmashState = (event) => setSmashed(event.detail);
    window.addEventListener('eh:hero-smash-state', onSmashState);
    return () => window.removeEventListener('eh:hero-smash-state', onSmashState);
  }, []);

  if (bodyCount === 0 && !smashed) return null;

  return (
    <button
      type="button"
      className="physics-reset"
      onClick={() => {
        uiClick();
        window.dispatchEvent(new Event('eh:physics-reset'));
      }}
    >
      <span aria-hidden="true">↺</span> reset
    </button>
  );
}
```

- [ ] Run `npm run build` and `npm run lint` from `frontend/`. Expected: both succeed.
- [ ] Commit:

```bash
git add frontend/src/components/ResetPhysics.jsx
git commit -m "fix: reset button stays visible for the whole smashed state, not just while bodies exist"
```

### Task 5: End-to-end verification

**Files:** none (manual + Playwright verification only, matching this repo's existing convention — there is no test runner configured)

- [ ] Start the dev server (`npm run dev` from `frontend/`) and open it in a desktop-width browser (viewport ≥ 1024px wide).
- [ ] Send a chat message. Confirm: `whomp` plays, the terminal expands, all ~15 text/stat pieces and both CTA buttons fly toward the left and disappear, and within about a second nothing is left anywhere on screen (no pile at the bottom, no elements resting against the terminal).
- [ ] While pieces are still mid-flight, try clicking/dragging one. Confirm nothing happens (they're not grabbable).
- [ ] Confirm the reset button is visible throughout, including after every piece and button has already vanished (body count back to 0 but the hero is still collapsed).
- [ ] Click reset. Confirm: hero text is back in its original flow position (title reads "Turning ideas into code I trust." again), both CTA buttons are back in place and clickable, the terminal is compact again, and the reset button disappears.
- [ ] Send another chat message after the reset. Confirm the smash fires again correctly (same fly-off behavior, not a stale/broken state).
- [ ] Outside of any smash, grab a CTA button by its "throw me" hint and drag/fling it. Confirm it behaves exactly as before: collides with the floor/walls, can be picked back up, and the reset button both appears for it and correctly restores it.
- [ ] Resize to a mobile-width viewport (< 1024px) and confirm sending a message does not trigger any smash/expansion.
- [ ] Emulate `prefers-reduced-motion: reduce` and confirm sending a message does not trigger any smash/expansion.
- [ ] Check the browser console throughout for unexpected errors (the "connection failed" chat message is expected without a backend running; nothing else should appear).
- [ ] Final `npm run build` + `npm run lint` from `frontend/` — both must succeed.
- [ ] Report results back, noting any visual tuning that was needed for the exit velocities to look right (the spec calls out that the exact numbers are a first pass, tuned during implementation).
