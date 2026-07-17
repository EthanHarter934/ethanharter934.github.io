import { useEffect, useRef, useState } from 'react';
import { profile } from '../data/portfolio';
import { ensureAudio, grab, uiClick, whomp } from '../utils/sfx';
import { addBody, beginDrag, clearEdge, removeBody, setEdge } from '../utils/physicsWorld';
import Reveal from './Reveal';
import Terminal from './Terminal';
import Throwable from './Throwable';

export default function Hero() {
  const smashedRef = useRef(false);
  const [smashed, setSmashed] = useState(false);
  const heroInnerRef = useRef(null);
  const primaryCtaRef = useRef(null);
  const resumeRef = useRef(null);
  const smashCleanupRef = useRef(null);

  // global reset: rebuild the hero exactly as it was before the smash
  useEffect(() => {
    const onReset = () => {
      const cleanup = smashCleanupRef.current;
      if (cleanup) {
        cleanup.abort.abort();
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
      clearEdge();
      smashedRef.current = false;
      setSmashed(false);
    };
    window.addEventListener('eh:physics-reset', onReset);
    return () => window.removeEventListener('eh:physics-reset', onReset);
  }, []);

  const handleWorkClick = (event) => {
    uiClick();
    event.preventDefault();
    document.querySelector('#work')?.scrollIntoView({ behavior: 'smooth' });
  };

  // first send: the terminal expands and physically shoves the hero copy
  // aside. One hitbox per copy block; the buttons launch as themselves.
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

    // the connective words don't survive the impact
    for (const el of drops) el.classList.add('word-fade');

    const cleanup = { pieces, drops, bodies: [], abort: new AbortController() };
    smashCleanupRef.current = cleanup;

    pieces.forEach((el, i) => {
      const rect = rects[i];
      el.style.width = `${rect.width}px`;
      el.style.margin = '0';
      el.style.position = 'fixed';
      el.style.left = '0';
      el.style.top = '0';
      el.style.zIndex = 5; // behind the terminal so the pile can't cover the chat
      el.classList.add('smashed-piece');
      const body = addBody({
        el,
        x: rect.left,
        y: rect.top,
        w: rect.width,
        h: rect.height,
        vx: -60 - Math.random() * 90,
        vy: -40 - Math.random() * 120,
        va: (Math.random() - 0.5) * 3,
      });
      cleanup.bodies.push(body);
      el.addEventListener(
        'pointerdown',
        (event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          ensureAudio();
          grab();
          beginDrag(body, event.clientX, event.clientY);
        },
        { signal: cleanup.abort.signal },
      );
    });

    primaryCtaRef.current?.launch(-260, -120);
    resumeRef.current?.launch(-200, -160);

    setSmashed(true);

    // the expanding terminal is a moving wall while the grid animates
    let prevLeft = term.getBoundingClientRect().left;
    let prevT = performance.now();
    let raf = 0;
    const track = (now) => {
      const rect = term.getBoundingClientRect();
      const dt = Math.max((now - prevT) / 1000, 0.001);
      const vx = (rect.left - prevLeft) / dt;
      setEdge({ x: rect.left, vx, top: rect.top, bottom: rect.bottom });
      prevLeft = rect.left;
      prevT = now;
      raf = requestAnimationFrame(track);
    };
    raf = requestAnimationFrame(track);
    setTimeout(() => {
      cancelAnimationFrame(raf);
      clearEdge();
    }, 950);
  };

  return (
    <section className="hero" id="top">
      <div
        ref={heroInnerRef}
        className={`hero-inner container ${smashed ? 'term-expanded' : ''}`}
      >
        <div className="hero-copy">
          <Reveal y={16}>
            <p className="hero-eyebrow" data-smash="chunk">
              <span className="dot" aria-hidden="true" />
              open to internships &amp; software roles
            </p>
          </Reveal>

          <Reveal delay={0.07} y={22}>
            <h1 className="hero-title">
              <span data-smash="chunk">Turning</span> <span data-smash="chunk">ideas</span>{' '}
              <span data-smash="chunk">into</span> <span className="acc" data-smash="chunk">code</span>{' '}
              <span className="acc" data-smash="chunk">I</span>{' '}
              <span className="acc" data-smash="chunk">trust.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.14} y={22}>
            <p className="hero-lede">
              <span data-smash="drop">I&apos;m </span>
              <strong data-smash="chunk">Ethan Harter</strong>
              <span data-smash="drop">, a </span>
              <span data-smash="chunk">CS student</span>
              <span data-smash="drop"> at </span>
              <span data-smash="chunk">Oregon State</span>
              <span data-smash="drop"> who spends a lot of time building and training </span>
              <span data-smash="chunk">AI systems</span>
              <span data-smash="drop">. I&apos;ve entered two hackathons so far and </span>
              <span className="highlight" data-smash="chunk">won first place at both</span>
              <span data-smash="drop">.</span>
            </p>
          </Reveal>

          <Reveal delay={0.21} y={18}>
            <div className="hero-meta">
              {profile.stats.map((stat) => (
                <div key={stat.label} className="hm" data-smash="chunk">
                  <b>{stat.value}</b>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.28} y={18}>
            <div className="hero-ctas">
              <Throwable ref={primaryCtaRef} hint="throw me">
                <a href="#work" className="btn-primary" onClick={handleWorkClick}>
                  See the work <span aria-hidden="true">→</span>
                </a>
              </Throwable>
              <Throwable ref={resumeRef}>
                <a
                  href="/CS_AI Resume.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-quiet link-sweep"
                  onClick={() => uiClick()}
                >
                  résumé ↗
                </a>
              </Throwable>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.18} y={26} className="hero-terminal">
          <Terminal onSend={handleTerminalSend} />
          <div className="operator">
            <img src={profile.photo} alt={`${profile.name}, ${profile.title}`} />
            <p className="op-text">
              <b>operator:</b> ethan harter · corvallis, or
              <br />
              <b>uptime:</b> senior year · graduating june 2027
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
