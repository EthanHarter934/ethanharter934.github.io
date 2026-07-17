# Deeper Sounds, Shared Physics World, and Terminal Smash-Expand — Design

Date: 2026-07-17
Status: Approved

## Goals

1. Make every non-chain sound deeper and quieter (satisfying deep clicks, not
   noticeably high pitched). The pull-chain click stays exactly as it is.
2. Improve the throwable "block" impact sounds (real weight, not clicky).
3. On the first chat send, the terminal cartoonishly expands leftward and
   smashes the hero copy aside using the same physics as the throwable buttons.
4. All free physics bodies (thrown buttons + smashed hero pieces) collide with
   each other so nothing overlaps; animations stay smooth.
5. Each hero-copy block gets one hitbox (no per-word physics).

## 1. Sound rework — `frontend/src/utils/sfx.js`

Chain `click()` is untouched (2400/1800Hz family, full level).

- `uiClick()` (new): deep quiet UI click for nav/buttons — bandpass noise
  ~700Hz + ~100Hz thump, short decay. Replaces `click(true, 0.35)` at all
  Navbar/Hero/Footer call sites.
- `grab()`: noise center 1500Hz → 600Hz, thump 120Hz → 95Hz.
- `thud(velocity)`: becomes thump-first — sine 70–140Hz (pitch and gain scale
  with velocity) with a small low (~400Hz) noise component. Threshold and
  rate-limit behavior unchanged.
- `key()`: noise center 2100–2800Hz → 1000–1400Hz, same tiny gain.
- `send()`: deep double-thock (two staggered low mech hits, ~650Hz noise +
  ~120Hz thump) instead of the bright 2800Hz tick.
- `whomp()` (new): terminal expansion — sine sweep 150→50Hz over ~0.35s with a
  soft lowpassed noise rumble. Louder than uiClick, quieter than the chain.

## 2. Shared physics world — `frontend/src/utils/physicsWorld.js`

Singleton module owning all free bodies in one rAF loop:

- AABB bodies: `{ x, y, w, h, vx, vy }`, gravity ~2900 px/s², viewport
  walls/floor (8px edge), ground friction, restitution ~0.3.
- **Body-vs-body collisions**: overlap test, positional separation along the
  minimum axis, impulse exchange with restitution, 2–3 solver iterations per
  frame. Bodies sleep when slow and touching support; any contact or drag
  wakes them. The loop stops entirely when all bodies sleep.
- Dragging: a dragged body is kinematic (follows pointer, samples velocity
  for the fling on release) and pushes other bodies out of its way.
- Kinematic edge: `pushFromRight(edgeX, edgeVX)` — during the terminal
  expansion each frame, any body whose right side crosses the edge is clamped
  left of it and given at least the edge's leftward speed × 1.2.
- Impact callback: world emits `(body, speed)` on wall/floor/body impacts;
  the integration layer plays `thud(speed)`.
- API: `addBody(opts) → body`, `removeBody(body)`, `beginDrag/moveDrag/endDrag`,
  `setEdge(x, vx)` / `clearEdge()`, `onImpact(cb)`. Bodies position their DOM
  element via `translate3d` each frame.

`Throwable.jsx` keeps its component API (`children`, `hint`) and feel, but
delegates simulation to the world once a drag crosses the threshold. Thrown
buttons therefore stack and collide instead of overlapping.

## 3. Terminal smash-expand

Trigger: first successful send in this page load (input non-empty, booted).
Preconditions: viewport ≥ 1024px wide (two-column hero) and no
`prefers-reduced-motion`. Otherwise nothing happens (mobile terminal is
already effectively full-width).

Sequence:

1. `Terminal` calls a new `onSend()` prop (fired in `handleSend` after the
   guard). `Hero` owns the orchestration.
2. Hero measures each `.hero-copy` block (eyebrow, title, lede, meta, CTA row)
   `getBoundingClientRect()`, then converts each block to `position: fixed`
   at its rect and registers it as a world body. The CTA row's two buttons are
   released as their own bodies (their Throwable free-state), the row wrapper
   excluded. Pieces remain grabbable/throwable afterward via the world.
3. The hero grid animates: `.hero-inner` gets a `term-expanded` class,
   transitioning `grid-template-columns` to collapse the copy column with an
   overshoot ease (cubic-bezier(0.34, 1.56, 0.64, 1), ~0.55s); the terminal
   gets a brief scaleX squash-stretch pulse. `whomp()` plays.
4. During the transition, each frame Hero measures the terminal's left edge
   and feeds `setEdge(edgeX, edgeVX)` to the world so the expanding terminal
   physically shoves the pieces leftward at its own speed (×1.2). On
   transition end, `clearEdge()`.
5. Pieces bounce off the left wall/floor with velocity-scaled thuds, collide
   with each other and with any thrown buttons, and settle into a pile at the
   viewport bottom for the rest of the page load.

Reload resets everything: hero copy is back, terminal is compact (chat
history still restores from sessionStorage), and the next send smashes again.
No persistence of the smashed state.

## Error handling

- All sfx remain gesture-driven no-ops without AudioContext.
- World is defensive: missing elements skip registration; capped velocities;
  dt clamped (≤32ms) so background tabs don't explode the sim.
- If the terminal edge measurement fails (no rect), expansion still animates;
  pieces just get a fixed leftward impulse fallback.

## Testing / verification

- Backend untouched this round.
- `npm run build` + `npm run lint`.
- Playwright desktop: send a chat message → terminal expands, hero pieces fly
  left, land, and none overlap (pairwise AABB check of resting pieces); throw
  both CTA buttons onto the pile → still no overlap; no console errors;
  reload → hero restored, terminal compact.
- Playwright mobile viewport: send → no expansion, layout unchanged.
- Reduced-motion emulation: send → no expansion, no body conversion.
