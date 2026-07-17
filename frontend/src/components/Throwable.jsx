import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { addBody, beginDrag, onImpact, removeBody } from '../utils/physicsWorld';
import { ensureAudio, grab, thud } from '../utils/sfx';

// Wraps a button or link so you can pick it up and throw it.
// Thrown elements become bodies in the shared physics world: gravity,
// viewport walls, and collisions against every other free body, coming
// to rest at the bottom of the screen (position: fixed) where they keep
// working as a scattered little dock. A plain click still does what the
// button always did.
// Pass `hint="throw me"` to show a little nudge when the cursor gets
// close (dismissed after the first throw). Parents can also call
// `ref.launch(vx, vy)` to eject the element with an initial velocity.

const DRAG_THRESHOLD = 7; // px of movement before a click becomes a throw
const HINT_RADIUS = 150; // px cursor distance that reveals the hint

// every world impact sounds like weight
onImpact(thud);

function HintArrow() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden="true">
      <path
        d="M10.5 18.5C8.5 14.5 7.5 10 8.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M4.5 7.5L8.5 3l4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

const Throwable = forwardRef(function Throwable({ children, hint }, ref) {
  const bodyRef = useRef(null);
  const [free, setFree] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hintVisible, setHintVisible] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const phys = useRef({
    body: null,
    dragging: false,
    started: false,
    free: false,
    exiting: false,
    startX: 0,
    startY: 0,
    suppressClick: false,
    reduce: false,
  });

  useEffect(() => {
    phys.current.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // the global reset button puts thrown elements back in the layout
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
      setExiting(false);
    };
    window.addEventListener('eh:physics-reset', onReset);
    return () => window.removeEventListener('eh:physics-reset', onReset);
  }, []);

  const dismissHint = () => {
    setHintDismissed(true);
    setHintVisible(false);
  };

  // measure the element and hand it to the physics world
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

  useImperativeHandle(ref, () => ({
    launch(vx, vy) {
      if (phys.current.reduce) return;
      if (hint) dismissHint();
      freeUp(vx, vy);
    },
    // like launch, but the element passes through everything and is
    // removed once it clears the left edge instead of joining the pile
    vanish(vx, vy) {
      if (phys.current.reduce) return;
      if (hint) dismissHint();
      phys.current.exiting = true;
      setExiting(true);
      freeUp(vx, vy, true);
    },
  }));

  // reveal the hint when the cursor wanders close to the button
  useEffect(() => {
    if (!hint || hintDismissed || free || phys.current.reduce) return undefined;
    let raf = 0;
    const onMove = (event) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = bodyRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        setHintVisible(Math.hypot(dx, dy) < HINT_RADIUS);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, [hint, hintDismissed, free]);

  const onPointerDown = (event) => {
    const p = phys.current;
    if (p.reduce || p.exiting) return;
    if (event.button !== 0) return;
    // stop the browser from starting a text selection on a fast flick
    event.preventDefault();
    p.dragging = true;
    p.started = false;
    p.suppressClick = false;
    p.startX = event.clientX;
    p.startY = event.clientY;
    ensureAudio();
  };

  // threshold detection lives on window: a fast flick outruns pointer events
  // on the element itself. Once the drag starts, the world takes over.
  useEffect(() => {
    const onMove = (event) => {
      const p = phys.current;
      if (!p.dragging || p.started) return;
      if (event.buttons === 0) {
        // the pointer was released somewhere we couldn't see
        p.dragging = false;
        return;
      }
      if (Math.hypot(event.clientX - p.startX, event.clientY - p.startY) < DRAG_THRESHOLD)
        return;
      p.started = true;
      p.suppressClick = true;
      grab();
      if (hint) dismissHint();
      const body = freeUp(0, 0);
      beginDrag(body, event.clientX, event.clientY);
    };

    const onUp = () => {
      const p = phys.current;
      if (!p.dragging) return;
      // the world ends its own drag on pointerup; just reset local state
      p.dragging = false;
      p.started = false;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [hint]);

  const onClickCapture = (event) => {
    const p = phys.current;
    if (p.suppressClick) {
      event.preventDefault();
      event.stopPropagation();
      p.suppressClick = false;
    }
  };

  return (
    <>
      {free && (
        <span
          aria-hidden="true"
          style={{ display: 'inline-block', width: size.w, height: size.h, visibility: 'hidden' }}
        />
      )}
      <span
        ref={bodyRef}
        onPointerDown={onPointerDown}
        onClickCapture={onClickCapture}
        onDragStart={(event) => event.preventDefault()}
        style={{
          display: 'inline-block',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          ...(free
            ? { position: 'fixed', left: 0, top: 0, zIndex: 400, cursor: exiting ? 'default' : 'grab' }
            : { position: 'relative' }),
        }}
      >
        {children}
        {hint && !hintDismissed && !free && (
          <span className={`throw-hint ${hintVisible ? 'show' : ''}`} aria-hidden="true">
            <HintArrow />
            throw me
          </span>
        )}
      </span>
    </>
  );
});

export default Throwable;
