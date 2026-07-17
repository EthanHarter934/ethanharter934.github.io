import { useEffect, useRef, useState } from 'react';

// Wraps a button or link so you can pick it up and throw it.
// Thrown elements get gravity, bounce off the viewport edges, and
// come to rest at the bottom of the screen (position: fixed), where
// they keep working as a scattered little dock. A plain click still
// does what the button always did.

const GRAVITY = 2900; // px/s^2
const RESTITUTION = 0.45;
const EDGE = 8;
const DRAG_THRESHOLD = 7; // px of movement before a click becomes a throw
const MAX_FLING = 2600; // px/s

export default function Throwable({ children }) {
  const bodyRef = useRef(null);
  const [free, setFree] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const phys = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    dragging: false,
    started: false,
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
        if (Math.abs(p.vy) > 150) {
          p.vy = -p.vy * RESTITUTION;
        } else {
          p.vy = 0;
        }
        p.vx *= 0.92; // ground friction
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
    p.dragging = true;
    p.started = false;
    p.startX = event.clientX;
    p.startY = event.clientY;
    const rect = bodyRef.current.getBoundingClientRect();
    p.grabDX = event.clientX - rect.left;
    p.grabDY = event.clientY - rect.top;
    p.samples = [{ t: event.timeStamp, x: event.clientX, y: event.clientY }];
    try {
      bodyRef.current.setPointerCapture(event.pointerId);
    } catch {
      // no active pointer (synthetic event); drag still works via bubbling
    }
    stopLoop();
  };

  const onPointerMove = (event) => {
    const p = phys.current;
    if (!p.dragging) return;

    if (!p.started) {
      if (Math.hypot(event.clientX - p.startX, event.clientY - p.startY) < DRAG_THRESHOLD) return;
      p.started = true;
      p.suppressClick = true;
      if (!free) {
        const rect = bodyRef.current.getBoundingClientRect();
        p.x = rect.left;
        p.y = rect.top;
        applyTransform();
        setSize({ w: rect.width, h: rect.height });
        setFree(true);
      }
    }

    p.x = event.clientX - p.grabDX;
    p.y = event.clientY - p.grabDY;
    p.samples.push({ t: event.timeStamp, x: event.clientX, y: event.clientY });
    if (p.samples.length > 6) p.samples.shift();
    applyTransform();
  };

  const onPointerUp = () => {
    const p = phys.current;
    if (!p.dragging) return;
    p.dragging = false;
    if (!p.started) return; // plain click, let it through

    const first = p.samples[0];
    const lastSample = p.samples[p.samples.length - 1];
    const dt = Math.max((lastSample.t - first.t) / 1000, 0.016);
    p.vx = Math.max(-MAX_FLING, Math.min(MAX_FLING, (lastSample.x - first.x) / dt));
    p.vy = Math.max(-MAX_FLING, Math.min(MAX_FLING, (lastSample.y - first.y) / dt));
    startLoop();
  };

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
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        onDragStart={(event) => event.preventDefault()}
        style={{
          display: 'inline-block',
          touchAction: 'none',
          ...(free
            ? { position: 'fixed', left: 0, top: 0, zIndex: 400, cursor: 'grab' }
            : null),
        }}
      >
        {children}
      </span>
    </>
  );
}
