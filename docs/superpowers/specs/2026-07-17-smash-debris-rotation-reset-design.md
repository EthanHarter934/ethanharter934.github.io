# Smash Debris, Rotation, and Physics Reset — Design

Date: 2026-07-17
Status: Approved (iteration on the terminal smash feature)

## Goals

1. The smash produces smaller pieces, not full-width slabs.
2. Bodies rotate: tumble in flight, settle mostly flat. Tilt capped ~28 degrees
   (0.5 rad) because collisions stay axis-aligned boxes.
3. The lede paragraph sheds its connective words on impact; only meaningful
   fragments survive as pieces. Dropped words fade out with a slight blur.
4. A subtle reset button in the bottom-right corner restores every thrown
   button and smashed piece to its original place, visible only while any
   physics body exists.

## Chunking (Hero.jsx markup)

Chunks are marked `data-smash="chunk"` and render as `inline-block` (scoped to
title/lede only so the eyebrow/stat layouts keep their own display). Droppable
words are `data-smash="drop"`.

- Eyebrow: whole line, 1 piece.
- Title: one chunk per word — "Turning" / "ideas" / "into" / "code" / "I" /
  "trust." (the last three each keep the accent color).
- Lede keepers: "Ethan Harter" (strong), "CS student", "Oregon State",
  "AI systems", "won first place at both" (highlight). Everything else is a
  drop span.
- Stats: each `.hm` block is a chunk (3 pieces).

Total: 15 pieces + 2 launched buttons.

## Rotation (physicsWorld.js)

- Body gains `angle` (rad) and `va` (rad/s); transform becomes
  `translate3d(...) rotate(angle)`, `transform-origin: 50% 50%` set at addBody.
- Integration: `angle += va*dt`, air damp `va *= 0.995`; tilt clamped to
  ±0.5 rad (excess `va` zeroed at the clamp).
- Spin sources: floor bounce (`va += vx*0.0035`), wall bounce (from `vy`),
  body-vs-body impulse (small kick from relative velocity), terminal edge
  shove (small randomized tumble on first contact), fling release
  (`va` from fling vx), `launch()` (small random spin).
- Grounded settle: `va *= 0.85`, `angle *= 0.96` per frame, so pieces end
  mostly-but-not-perfectly flat. Sleep zeroes `va` and freezes the angle.
- Dragging: angle eases toward a small tilt proportional to horizontal drag
  velocity (pendulum feel), `va` reset on release from fling velocity.

## Word dropping

On smash, all `[data-smash="drop"]` spans get a `.word-fade` class
(opacity 0 + 3px blur over 0.35s); the collapsing copy column hides the rest.
Reset removes the class.

## Reset button

- New `ResetPhysics.jsx` rendered from `Home.jsx`: fixed bottom-right,
  mono "↺ reset", low opacity until hover, `z-index` above thrown buttons
  (410 > 400), surface background so it stays legible over debris.
- Visible only when the world has bodies: world gains
  `onBodiesChange(cb)` (called with the count on add/remove) and
  `getBodyCount()`.
- Click: `uiClick()` + dispatch `window` event `eh:physics-reset`.
  - Every `Throwable` listens: if free, remove its body, clear the inline
    transform, return to flow (placeholder removed).
  - `Hero` listens: remove piece bodies, strip the inline styles set at smash
    (width/margin/position/left/top/z-index/transform/transform-origin),
    remove `.smashed-piece`, un-fade drop spans, abort the piece pointerdown
    listeners (AbortController), `clearEdge()`, un-expand the terminal
    (`term-expanded` off; the existing grid transition animates it back),
    and re-arm the smash for the next send.

## Testing / verification

- Build + lint.
- Playwright desktop: smash → 12 pieces, transforms contain `rotate`, resting
  interpenetration stays invisible (≤3px), drop spans faded, chat input
  reachable; reset button visible → click → zero pieces, hero copy restored
  in flow, terminal compact, reset button hidden; send again → smash re-fires.
  Throw-only case: throw one button → reset appears → click → button back in
  flow, reset hidden.
- Mobile + reduced-motion still skip the smash; reset never appears there
  unless something was thrown (mobile throws still work; reset must too).
