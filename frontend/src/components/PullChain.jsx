import { useEffect, useRef, useState } from 'react';
import { click, ensureAudio } from '../utils/sfx';

// Physical pull-chain light switch. A verlet rope hangs from under
// the navbar; drag the handle down past the threshold and the lights
// flip with a mechanical click. A second, softer click plays when you
// let go and the chain snaps back. Keyboard users get a hidden
// focusable button over the same spot.

const SEGMENTS = 9;
const SEG_LEN = 12;
const ANCHOR_X = 45;
const PULL_THRESHOLD = 40;
const HINT_RADIUS = 150;

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

export default function PullChain({ onToggle, theme }) {
  const svgRef = useRef(null);
  const lineRef = useRef(null);
  const beadsRef = useRef(null);
  const handleRef = useRef(null);
  const hitRef = useRef(null);
  const onToggleRef = useRef(onToggle);
  const dismissHintRef = useRef(() => {});
  const [hintVisible, setHintVisible] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);

  useEffect(() => {
    onToggleRef.current = onToggle;
  }, [onToggle]);

  useEffect(() => {
    dismissHintRef.current = () => {
      setHintDismissed(true);
      setHintVisible(false);
    };
  }, []);

  // reveal the hint when the cursor gets close to the handle
  useEffect(() => {
    if (hintDismissed) return undefined;
    let raf = 0;
    const onMove = (event) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const hit = hitRef.current;
        if (!hit) return;
        const rect = hit.getBoundingClientRect();
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
  }, [hintDismissed]);

  useEffect(() => {
    const svg = svgRef.current;
    const line = lineRef.current;
    const beads = beadsRef.current;
    const handle = handleRef.current;
    const hit = hitRef.current;
    if (!svg) return undefined;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const restY = SEGMENTS * SEG_LEN;

    // verlet points; index 0 is pinned to the anchor
    const pts = Array.from({ length: SEGMENTS + 1 }, (_, i) => ({
      x: ANCHOR_X,
      y: i * SEG_LEN,
      px: ANCHOR_X,
      py: i * SEG_LEN,
    }));

    let raf = 0;
    let dragging = false;
    let fired = false;
    let drag = { x: 0, y: 0 };
    let t = 0;

    const beadEls = beads.children;

    // the switch engages: theme flips with the first click
    function fireToggle() {
      click(true);
      onToggleRef.current?.();
      dismissHintRef.current();
    }

    function render() {
      const segs = pts.map((p) => `${p.x},${p.y}`).join(' ');
      line.setAttribute('points', segs);
      for (let i = 0; i < beadEls.length; i += 1) {
        const p = pts[i + 1];
        beadEls[i].setAttribute('cx', p.x);
        beadEls[i].setAttribute('cy', p.y);
      }
      const end = pts[pts.length - 1];
      handle.setAttribute('cx', end.x);
      handle.setAttribute('cy', end.y + 7);
      hit.setAttribute('cx', end.x);
      hit.setAttribute('cy', end.y + 7);
    }

    function step() {
      t += 1;

      for (let i = 1; i < pts.length; i += 1) {
        const p = pts[i];
        const vx = (p.x - p.px) * 0.975;
        const vy = (p.y - p.py) * 0.975;
        p.px = p.x;
        p.py = p.y;
        p.x += vx + Math.sin(t * 0.008 + i) * 0.012; // faint idle sway
        p.y += vy + 0.55; // gravity
      }

      if (dragging) {
        const end = pts[pts.length - 1];
        end.x += (drag.x - end.x) * 0.55;
        end.y += (drag.y - end.y) * 0.55;
      }

      // distance constraints
      for (let k = 0; k < 4; k += 1) {
        pts[0].x = ANCHOR_X;
        pts[0].y = 0;
        for (let i = 0; i < pts.length - 1; i += 1) {
          const a = pts[i];
          const b = pts[i + 1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const diff = (dist - SEG_LEN) / dist;
          const ax = i === 0 ? 0 : 0.5;
          const bx = i === 0 ? 1 : 0.5;
          a.x += dx * diff * ax;
          a.y += dy * diff * ax;
          b.x -= dx * diff * bx;
          b.y -= dy * diff * bx;
        }
      }

      // pull detection while dragging: the pointer is the honest signal,
      // since the rope itself only stretches a little past rest
      if (dragging && !fired && drag.y - restY > PULL_THRESHOLD) {
        fired = true;
        fireToggle();
      }

      render();
      raf = requestAnimationFrame(step);
    }

    function svgPoint(e) {
      const rect = svg.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * 90,
        y: ((e.clientY - rect.top) / rect.height) * 190,
      };
    }

    // only the handle receives pointer events (the svg is pointer-transparent
    // so it never blocks page content); drags continue on window
    function onDown(e) {
      dragging = true;
      fired = false;
      drag = svgPoint(e);
      svg.classList.add('grabbing');
      try {
        hit.setPointerCapture(e.pointerId);
      } catch {
        // no active pointer (synthetic event); window listeners cover the drag
      }
      ensureAudio();
      e.preventDefault();
    }

    function onMove(e) {
      if (dragging) drag = svgPoint(e);
    }

    // touch backstop: some browsers ignore touch-action on svg children and
    // try to scroll mid-pull, cancelling the pointer stream
    function onTouchMove(e) {
      if (dragging && e.cancelable) e.preventDefault();
    }

    function onUp() {
      if (!dragging) return;
      dragging = false;
      svg.classList.remove('grabbing');
      if (fired) {
        // the chain snaps back home: softer second click
        setTimeout(() => click(false), 90);
      }
      fired = false;
    }

    hit.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    const removeListeners = () => {
      hit.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('touchmove', onTouchMove);
    };

    if (reduce) {
      // static chain; clicking the handle still toggles
      render();
      const clickToggle = () => fireToggle();
      hit.addEventListener('click', clickToggle);
      return () => {
        hit.removeEventListener('click', clickToggle);
        removeListeners();
      };
    }

    raf = requestAnimationFrame(step);

    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(step);
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      removeListeners();
    };
  }, []);

  const handleKeyToggle = () => {
    ensureAudio();
    click(true);
    setTimeout(() => click(false), 120);
    onToggle?.();
    dismissHintRef.current();
  };

  return (
    <div className="chain-wrap" aria-hidden={false}>
      <svg ref={svgRef} viewBox="0 0 90 190" role="presentation">
        <rect className="chain-anchor" x={ANCHOR_X - 5} y="0" width="10" height="4" rx="1.5" />
        <polyline ref={lineRef} className="chain-link" points="" />
        <g ref={beadsRef}>
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <circle key={i} className="chain-bead" r="2.4" />
          ))}
        </g>
        <circle ref={handleRef} className="chain-handle" r="7.5" />
        <circle ref={hitRef} className="chain-hit" r="21" />
      </svg>
      {!hintDismissed && (
        <span className={`chain-hint ${hintVisible ? 'show' : ''}`} aria-hidden="true">
          <HintArrow />
          pull me
        </span>
      )}
      <button
        type="button"
        className="chain-a11y"
        onClick={handleKeyToggle}
        aria-pressed={theme === 'light'}
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      />
    </div>
  );
}
