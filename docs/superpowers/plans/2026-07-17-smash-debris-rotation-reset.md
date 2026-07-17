# Smash Debris, Rotation, and Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Smaller smash debris (per-word title, kept lede fragments, per-stat blocks), rotating bodies, fading dropped words, and a global physics reset button.

**Architecture:** Chunk markup lives in `Hero.jsx` via `data-smash="chunk"|"drop"` attributes; the smash queries chunks generically. Rotation is added to `physicsWorld.js` bodies (angle/va, capped tilt, AABB collision unchanged). Reset is an event: a new `ResetPhysics.jsx` (shown while the world has bodies, via a new `onBodiesChange` subscription) dispatches `eh:physics-reset`; `Throwable` and `Hero` listeners restore their own elements.

**Tech Stack:** unchanged (React 19, vanilla rAF physics, Web Audio).

## Global Constraints

- Tilt cap ±0.5 rad; collisions remain AABB.
- Reset must restore the exact pre-smash DOM state (styles set at smash are removed, not overwritten).
- Reset button: fixed bottom-right, mono, subtle (low opacity, hover to full), z-index 410, only rendered while bodies exist.
- No em dashes in any copy. Build + lint after each task; commit each task.

---

### Task 1: Rotation in the physics world

**Files:** Modify `frontend/src/utils/physicsWorld.js`

- [ ] Body init gains `angle: 0, va: va0` (new optional `va` in addBody opts); `addBody` sets `el.style.transformOrigin = '50% 50%'`.
- [ ] `applyTransform`: `translate3d(...) rotate(${b.angle}rad)`.
- [ ] Integration (awake, non-drag): `b.angle += b.va * dt; b.va *= 0.995;` then clamp: if `|angle| > 0.5` set to ±0.5 and zero `va` if pushing further.
- [ ] Spin kicks: floor bounce branch `b.va += b.vx * 0.0035`; grounded-settle branch `b.va *= 0.85; b.angle *= 0.96;`; left wall `b.va += b.vy * 0.003`, right wall `b.va -= b.vy * 0.003`; in `resolvePair` after an impulse, `kick = j * 0.004`, apply `+kick`/`-kick` to the non-kinematic bodies; edge shove gives `b.va += (Math.random() - 0.5) * 1.5` only on first contact (track `b.edgeTouched`, reset when clear of the edge).
- [ ] Drag: each frame `b.angle += (clamp(b.vx * 0.0004, ±0.3) - b.angle) * 0.15; b.va = 0;` and `endDrag` sets `body.va = clamp(body.vx * 0.0025, ±4)`.
- [ ] Sleep zeroes `va`.
- [ ] New subscription: `let changeCb = null; export function onBodiesChange(cb)` (returns unsubscribe), `export function getBodyCount()`; call `changeCb?.(bodies.length)` at the end of `addBody` and `removeBody`.
- [ ] Build; commit `feat: rotation and body-count subscription in physics world`.

### Task 2: Chunked hero markup + smash update

**Files:** Modify `frontend/src/components/Hero.jsx`, `frontend/src/styles/global.css`

- [ ] Eyebrow `p` gets `data-smash="chunk"`. Title becomes six word spans (`Turning`, `ideas`, `into`, and `code`, `I`, `trust.` each with `className="acc"`), all `data-smash="chunk"`, separated by spaces. Lede rewritten with keeper chunks ("Ethan Harter" strong, "CS student", "Oregon State", "AI systems", highlight "won first place at both") and `data-smash="drop"` connective spans reproducing the exact current sentence. Each `.hm` stat div gets `data-smash="chunk"`.
- [ ] Smash: `pieces = [...copy.querySelectorAll('[data-smash="chunk"]')]`; drop spans get `.word-fade`. Per piece: same fixed conversion as now plus varied kick `vx: -60 - Math.random()*90, vy: -40 - Math.random()*120, va: (Math.random()-0.5)*3`. Store cleanup info in a ref: `{ pieces, drops, bodies, abort: AbortController }`; piece pointerdown listeners use `{ signal: abort.signal }`.
- [ ] CSS: `.hero-title [data-smash='chunk'], .hero-lede [data-smash='chunk'] { display: inline-block; }`, `.word-fade { opacity: 0; filter: blur(3px); transition: opacity 0.35s ease, filter 0.35s ease; }`.
- [ ] Build + lint; visually confirm pre-smash layout unchanged; commit `feat: hero smashes into per-word and fragment debris`.

### Task 3: Reset button

**Files:** Create `frontend/src/components/ResetPhysics.jsx`; modify `frontend/src/pages/Home.jsx`, `frontend/src/components/Throwable.jsx`, `frontend/src/components/Hero.jsx`, `frontend/src/styles/global.css`

- [ ] `ResetPhysics.jsx`: subscribes `onBodiesChange`, renders nothing at zero bodies; button `↺ reset` class `physics-reset`; onClick `uiClick()` + `window.dispatchEvent(new Event('eh:physics-reset'))`. Render it in `Home.jsx` after `<Footer />`.
- [ ] `Throwable`: `useEffect` listener on `eh:physics-reset` → if free: `removeBody(body)`, clear `el.style.transform`, reset phys flags, `setFree(false)`.
- [ ] `Hero`: listener → abort piece listeners, `removeBody` each piece body, `removeProperty` for width/margin/position/left/top/z-index/transform/transform-origin, drop `.smashed-piece`, remove `.word-fade` from drops, `clearEdge()`, `smashedRef.current = false`, `setSmashed(false)`.
- [ ] CSS `.physics-reset`: fixed right 14px bottom 12px, z 410, mono 0.72rem, `var(--surface)` bg, 1px `var(--line)` border, radius 8px, padding 6px 10px, opacity 0.55 → 1 + `var(--ink)` on hover/focus-visible.
- [ ] Build + lint; commit `feat: subtle reset button restores thrown and smashed elements`.

### Task 4: End-to-end verification

- [ ] Desktop Playwright: smash → 15 `.smashed-piece` elements, every body transform contains `rotate(`, drop spans have `.word-fade`, input reachable, resting penetration ≤3px; reset visible → click → 0 pieces, title/lede text back in flow (title innerText contains "Turning ideas into code I trust."), terminal compact, reset hidden; send again → re-smash works. Throw-only: throw CTA → reset appears → click → restored/hidden. Reload sanity. Console: only expected 502s.
- [ ] Mobile: no smash; throw still works and reset restores it. Reduced-motion: no smash.
- [ ] Final build + lint; update memory; report.
