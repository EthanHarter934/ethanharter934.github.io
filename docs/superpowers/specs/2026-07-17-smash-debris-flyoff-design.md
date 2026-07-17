# Smash Debris Fly-Off — Design

Date: 2026-07-17
Status: Approved (iteration on the terminal smash feature)

## Goals

1. Replace "shove against the expanding terminal wall → bounce/settle into a
   floor pile" with a fast, straight fly-out through the left edge of the
   screen. Pieces disappear instead of accumulating.
2. The two CTA buttons ("See the work" / "résumé") that the smash launches
   get the same fly-off-and-vanish treatment as the text debris, instead of
   joining the persistent throwable pile.
3. Nothing launched by the smash is grabbable mid-flight — it's transient,
   not part of a persistent interactive pile.
4. Remove the terminal "kinematic edge" wall system entirely. Its removal
   also deletes the per-frame rAF loop in Hero.jsx that tracked the
   terminal's edge every frame during the expansion — a second concurrent
   animation loop that was a likely source of jank.
5. The reset button stays available for as long as the hero is in its
   smashed state, even after every piece and button has already exited and
   been removed from the physics world.
6. No regressions to: the terminal's CSS grid expansion animation, the
   drop-word fade, the debris z-index (renders in front of the terminal),
   the `white-space: nowrap` layout-shift fix on the collapsed copy column,
   or the independent "grab any throwable button, anytime" feature.

## 1. Physics world — `frontend/src/utils/physicsWorld.js`

New body option: `addBody({ ..., exit: true })`.

- Exit bodies still integrate gravity, velocity, and rotation every frame —
  identical math to any other body, so the same tumble/scatter character
  survives.
- Exit bodies are skipped entirely by both collision passes: the
  body-vs-body solver (`resolvePair`) and the wall/floor pass. They pass
  through everything — other exit bodies, thrown buttons, the viewport
  edges — since they're leaving, not settling.
- Exit bodies are exempt from the sleep system (no reason to ever sleep;
  they're removed instead).
- After integrating position each frame, any exit body with `x + w < -40`
  (a small buffer past the left edge) is collected and passed through the
  existing `removeBody` path.
- Launch velocities move from the old "gentle nudge, let the wall do the
  work" values (`vx` around -60 to -150 px/s) to fast, deliberate ones (`vx`
  roughly -900 to -1300 px/s) so pieces visibly exit the viewport in well
  under a second; gravity still applies, so there's a mild downward arc,
  not a dominant fall. Exact numbers get tuned visually during
  implementation.
- Delete `setEdge`, `clearEdge`, the module-level `edge` state, and the
  "expanding terminal shoves bodies leftward" block in `step()` — nothing
  uses a kinematic wall anymore. Their exports are removed too.
- Everything about thrown buttons (drag, fling, collide, floor, sleep) is
  untouched.

## 2. Throwable — `frontend/src/components/Throwable.jsx`

New imperative method alongside `launch`: `vanish(vx, vy)`.

- Sets a new `phys.current.exiting` flag, then runs the same
  measure-and-`addBody` sequence `launch`/`freeUp` already does, except it
  passes `exit: true` to `addBody`.
- While `exiting`, the component ignores `onPointerDown` and the
  window-level drag-threshold detection — an exiting button can't be
  grabbed.
- The existing free-state placeholder (the invisible spacer that holds the
  button's original slot in the CTA row's layout) is unchanged; `vanish`
  reuses the same `free` state under the hood.
- The `eh:physics-reset` handler also clears `exiting`, alongside its
  existing cleanup, so a reset mid-flight fully restores the button to a
  normal, draggable, in-flow state.
- The independent "grab and throw anytime" path (drag threshold → `freeUp`
  → normal physics body, no `exit` flag) is completely unchanged.

## 3. Hero — `frontend/src/components/Hero.jsx`

`handleTerminalSend`:

- Delete the edge-tracking block: the `track()` rAF loop, the
  `transitionend` listener, and the `fallback` timeout. Nothing needs to
  feed `setEdge` anymore.
- Delete the per-piece `pointerdown` → `beginDrag` listener and the
  `AbortController` that existed only to detach it — pieces are no longer
  grabbable, so `cleanup` no longer needs an `abort` field.
- Each piece keeps the same measure + convert-to-`position:fixed` step as
  today, but `addBody(...)` now passes `exit: true` and the faster
  leftward velocity described above (small randomized `vy` for scatter,
  no more of the old strong upward kick that existed to arc over the
  advancing wall).
- Replace `primaryCtaRef.current?.launch(...)` / `resumeRef.current?.launch(...)`
  with `.vanish(vx, vy)` calls, using a similarly fast leftward velocity.
- Broadcast the hero's smashed state for the reset button (see below):
  dispatch `window.dispatchEvent(new CustomEvent('eh:hero-smash-state', { detail: true }))`
  right when the smash triggers, and `{ detail: false }` inside the
  existing `eh:physics-reset` handler.
- Drop now-unused imports: `grab`, `ensureAudio`, `beginDrag`, `clearEdge`.

## 4. Reset button — `frontend/src/components/ResetPhysics.jsx`

- Add a second bit of state alongside the existing `onBodiesChange`
  subscription: listen for `eh:hero-smash-state` and track its `detail`
  boolean.
- Visible when either the physics world has bodies OR the hero is
  currently smashed. This guarantees the button never disappears out from
  under a still-collapsed hero just because every piece already exited and
  was removed from the world.
- The click handler (`uiClick()` + dispatch `eh:physics-reset`) is
  unchanged.

## Error handling

- Same defensive posture as the existing physics world: missing elements
  skip registration, dt is clamped, velocities are capped.
- If a piece somehow never crosses `x + w < -40` (e.g. a very wide
  viewport), it simply keeps flying off-screen indefinitely; harmless,
  since it's invisible and excluded from collisions either way. Reset still
  cleans it up via the existing `cleanup.bodies.forEach(removeBody)` path.

## Testing / verification

- `npm run build` + `npm run lint`.
- Playwright desktop: send a chat message → all ~15 text/stat pieces and
  both CTA buttons fly left and are fully gone (removed from the DOM's
  visible viewport, body count back to 0) within roughly a second; nothing
  is left at the bottom of the screen.
- Reset button stays visible throughout, including after everything has
  already vanished; clicking it fully restores the hero (text and buttons
  back in their original flow position, terminal compact again).
- Send again after a reset → smash fires again correctly.
- Manually drag-and-throw a CTA button with no smash triggered → completely
  unaffected (normal pile physics, stays grabbable, reset still works).
- Reduced-motion / mobile viewport: unchanged, smash still doesn't trigger.
