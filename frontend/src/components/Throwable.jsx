import { useEffect, useRef, useState } from 'react';

// Wraps a button or link so you can pick it up and throw it.
// Thrown elements get gravity, bounce off the viewport edges, and
// come to rest at the bottom of the screen (position: fixed), where
// they keep working as a scattered little dock. A plain click still
// does what the button always did.
// Pass `hint="throw me"` to show a little nudge when the cursor
// gets close (dismissed after the first throw).

const GRAVITY = 2900; // px/s^2
const RESTITUTION = 0.3;
const EDGE = 8;
const DRAG_THRESHOLD = 7; // px of movement before a click becomes a throw
const MAX_FLING = 1300; // px/s
const FLING_SCALE = 0.75; // take some heat off the raw pointer velocity
const HINT_RADIUS = 150; // px cursor distance that reveals the hint

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

export default function Throwable({ children, hint }) {
  const bodyRef = useRef(null);
  const [free, setFree] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hintVisible, setHintVisible] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const phys = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    dragging: false,
    started: false,
    free: false,
    grabDX: 0,
    grabDY: 0,
    startX: 0,
    startY: 0,
    samples: [],
    raf: 0,
    suppressClick: false,
    reduce: false,
  });

  useEffect(() => {
    phys.current.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const dismissHint = () => {
    setHintDismissed(true);
    setHintVisible(false);
  };

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

  const applyTransform = () => {
    const el = bodyRef.current;
    const p = phys.current;
    if (el) el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
  };

  const stopLoop = () => {
    cancelAnimationFrame(phys.current.raf);
    phys.current.raf = 0;
  };

  const startLoop = () => {
    stopLoop();
    let last = performance.now();
    const tick = (now) => {
      const p = phys.current;
      const el = bodyRef.current;
      if (!el) return;
      const dt = Math.min((now - last) / 1000, 0.032);
      last = now;

      p.vy += GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const floor = window.innerHeight - h - EDGE;
      const rightWall = window.innerWidth - w - EDGE;

      if (p.x < EDGE) {
        p.x = EDGE;
        p.vx = -p.vx * RESTITUTION;
      } else if (p.x > rightWall) {
        p.x = rightWall;
        p.vx = -p.vx * RESTITUTION;
      }

      if (p.y >= floor) {
        p.y = floor;
        if (Math.abs(p.vy) > 220) {
          p.vy = -p.vy * RESTITUTION;
        } else {
          p.vy = 0;
        }
        p.vx *= 0.88; // ground friction
      }

      applyTransform();

      const resting = p.y >= floor - 0.5 && p.vy === 0 && Math.abs(p.vx) < 12;
      if (resting) {
        p.raf = 0;
      } else {
        p.raf = requestAnimationFrame(tick);
      }
    };
    phys.current.raf = requestAnimationFrame(tick);
  };

  // keep resting elements on the floor when the window resizes
  useEffect(() => {
    if (!free) return undefined;
    const onResize = () => {
      const p = phys.current;
      const el = bodyRef.current;
      if (!el || p.raf || p.dragging) return;
      p.x = Math.min(p.x, window.innerWidth - el.offsetWidth - EDGE);
      p.y = window.innerHeight - el.offsetHeight - EDGE;
      applyTransform();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [free]);

  useEffect(() => stopLoop, []);

  const onPointerDown = (event) => {
    const p = phys.current;
    if (p.reduce) return;
    if (event.button !== 0) return;
    // stop the browser from starting a text selection on a fast flick
    event.preventDefault();
    p.dragging = true;
    p.started = false;
    p.suppressClick = false;
    p.startX = event.clientX;
    p.startY = event.clientY;
    const rect = bodyRef.current.getBoundingClientRect();
    p.grabDX = event.clientX - rect.left;
    p.grabDY = event.clientY - rect.top;
    p.samples = [{ t: event.timeStamp, x: event.clientX, y: event.clientY }];
    stopLoop();
  };

  // drag moves/ups live on window: a fast flick outruns pointer events on
  // the element itself, and pointer capture isn't an option because it
  // retargets the trailing click away from the button inside
  useEffect(() => {
    const onMove = (event) => {
      const p = phys.current;
      if (!p.dragging) return;
      if (event.buttons === 0) {
        // the pointer was released somewhere we couldn't see
        p.dragging = false;
        return;
      }

      if (!p.started) {
        if (Math.hypot(event.clientX - p.startX, event.clientY - p.startY) < DRAG_THRESHOLD)
          return;
        p.started = true;
        p.suppressClick = true;
        if (hint) dismissHint();
        if (!p.free) {
          const rect = bodyRef.current.getBoundingClientRect();
          p.x = rect.left;
          p.y = rect.top;
          applyTransform();
          setSize({ w: rect.width, h: rect.height });
          p.free = true;
          setFree(true);
        }
      }

      p.x = event.clientX - p.grabDX;
      p.y = event.clientY - p.grabDY;
      p.samples.push({ t: event.timeStamp, x: event.clientX, y: event.clientY });
      if (p.samples.length > 6) p.samples.shift();
      applyTransform();
    };

    const onUp = () => {
      const p = phys.current;
      if (!p.dragging) return;
      p.dragging = false;
      if (!p.started) return; // plain click, let it through

      const first = p.samples[0];
      const lastSample = p.samples[p.samples.length - 1];
      const dt = Math.max((lastSample.t - first.t) / 1000, 0.016);
      p.vx = Math.max(
        -MAX_FLING,
        Math.min(MAX_FLING, ((lastSample.x - first.x) / dt) * FLING_SCALE),
      );
      p.vy = Math.max(
        -MAX_FLING,
        Math.min(MAX_FLING, ((lastSample.y - first.y) / dt) * FLING_SCALE),
      );
      startLoop();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            ? { position: 'fixed', left: 0, top: 0, zIndex: 400, cursor: 'grab' }
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
}
