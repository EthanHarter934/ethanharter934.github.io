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
const MAX_DRAG_V = 2000; // cap on drag-frame velocity so impulses stay sane

let bodies = [];
let raf = 0;
let last = 0;
let impactCb = null;
let changeCb = null;
let dragBody = null;
let dragTarget = { x: 0, y: 0 };
let dragSamples = [];

export function onImpact(cb) {
  impactCb = cb;
}

// subscribe to body-count changes (drives the reset button's visibility)
export function onBodiesChange(cb) {
  changeCb = cb;
  cb(bodies.length);
  return () => {
    if (changeCb === cb) changeCb = null;
  };
}

export function getBodyCount() {
  return bodies.length;
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

export function addBody({ el, x, y, w, h, vx = 0, vy = 0, exit = false }) {
  const body = {
    el,
    x,
    y,
    w,
    h,
    vx,
    vy,
    exit,
    sleeping: false,
    stillFrames: 0,
  };
  bodies.push(body);
  applyTransform(body);
  wake(body);
  changeCb?.(bodies.length);
  return body;
}

export function removeBody(body) {
  bodies = bodies.filter((b) => b !== body);
  if (dragBody === body) {
    dragBody = null;
    detachDragListeners();
  }
  changeCb?.(bodies.length);
}

// ── dragging ──────────────────────────────────────────────────────────────
function onDragMove(e) {
  if (!dragBody) return;
  dragTarget = { x: e.clientX - dragBody.grabDX, y: e.clientY - dragBody.grabDY };
  dragSamples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
  if (dragSamples.length > 6) dragSamples.shift();
}

function onWindowUp() {
  if (dragBody) endDrag(dragBody);
}

function detachDragListeners() {
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onWindowUp);
  window.removeEventListener('pointercancel', onWindowUp);
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
  if (a.sleeping) wake(a);
  if (b.sleeping) wake(b);

  if (px < py) {
    const dir = a.x + a.w / 2 < b.x + b.w / 2 ? -1 : 1;
    const aShare = aKin ? 0 : bKin ? 1 : 0.5;
    a.x += dir * px * aShare;
    b.x -= dir * px * (1 - aShare);
    const rel = a.vx - b.vx;
    // impulse only for real hits; resting contact separates positionally so
    // a wedged pile can't pump velocity/spin into itself forever
    if (rel * dir < 0 && Math.abs(rel) > 40) {
      const j = (-(1 + RESTITUTION) * rel) / 2;
      if (Math.abs(rel) > 120) impact(Math.abs(rel));
      if (!aKin) a.vx += j;
      if (!bKin) b.vx -= j;
    }
  } else {
    const dir = a.y + a.h / 2 < b.y + b.h / 2 ? -1 : 1;
    // stacks settle crisply: the upper body takes the whole separation,
    // the floor (or the pile) anchors the lower one
    let aShare = aKin ? 0 : bKin ? 1 : dir === -1 ? 1 : 0;
    if (bKin) aShare = 1;
    a.y += dir * py * aShare;
    b.y -= dir * py * (1 - aShare);
    const rel = a.vy - b.vy;
    if (rel * dir < 0 && Math.abs(rel) > 40) {
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

  const clampDragV = (v) => Math.max(-MAX_DRAG_V, Math.min(MAX_DRAG_V, v));

  for (const b of bodies) {
    if (b === dragBody) {
      b.vx = clampDragV((dragTarget.x - b.x) / Math.max(dt, 0.001));
      b.vy = clampDragV((dragTarget.y - b.y) / Math.max(dt, 0.001));
      b.x = dragTarget.x;
      b.y = dragTarget.y;
      continue;
    }
    if (b.sleeping) continue;
    b.vy += GRAVITY * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }

  for (let pass = 0; pass < SOLVER_PASSES; pass += 1) {
    for (let i = 0; i < bodies.length; i += 1) {
      for (let j = i + 1; j < bodies.length; j += 1) {
        if (bodies[i].exit || bodies[j].exit) continue;
        resolvePair(bodies[i], bodies[j]);
      }
    }
    for (const b of bodies) {
      if (b === dragBody || b.exit) continue;
      const floor = window.innerHeight - b.h - EDGE;
      const right = window.innerWidth - b.w - EDGE;
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

  const toRemove = [];
  let allAsleep = true;
  for (const b of bodies) {
    applyTransform(b);
    if (b === dragBody) {
      allAsleep = false;
      continue;
    }
    if (b.exit) {
      // exit bodies never settle: once fully past the left edge they're gone
      if (b.x + b.w < -40) toRemove.push(b);
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
  for (const b of toRemove) removeBody(b);

  if (allAsleep && !dragBody) {
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
