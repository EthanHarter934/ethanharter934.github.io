import { useEffect, useRef, useState } from 'react';
import { profile } from '../data/portfolio';
import { uiClick, whomp } from '../utils/sfx';
import { addBody, removeBody } from '../utils/physicsWorld';
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
  const termFlipOuterRef = useRef(null);
  const termFlipInnerRef = useRef(null);

  // global reset: rebuild the hero exactly as it was before the smash
  useEffect(() => {
    const onReset = () => {
      const cleanup = smashCleanupRef.current;
      if (cleanup) {
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
      for (const el of [termFlipOuterRef.current, termFlipInnerRef.current]) {
        if (!el) continue;
        for (const prop of ['transform', 'transform-origin', 'transition']) {
          el.style.removeProperty(prop);
        }
      }
      termFlipOuterRef.current?.classList.remove('flip-clip');
      smashedRef.current = false;
      setSmashed(false);
      window.dispatchEvent(new CustomEvent('eh:hero-smash-state', { detail: false }));
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
    const flipOuter = termFlipOuterRef.current;
    const flipInner = termFlipInnerRef.current;
    if (!inner || !copy || !flipOuter || !flipInner) return;
    smashedRef.current = true;

    const pieces = [...copy.querySelectorAll('[data-smash="chunk"]')];
    const drops = [...copy.querySelectorAll('[data-smash="drop"]')];
    const rects = pieces.map((el) => el.getBoundingClientRect());

    whomp();
    window.dispatchEvent(new CustomEvent('eh:hero-smash-state', { detail: true }));

    // the connective words don't survive the impact
    for (const el of drops) el.classList.add('word-fade');

    const cleanup = { pieces, drops, bodies: [] };
    smashCleanupRef.current = cleanup;

    pieces.forEach((el, i) => {
      const rect = rects[i];
      el.style.width = `${rect.width}px`;
      el.style.margin = '0';
      el.style.position = 'fixed';
      el.style.left = '0';
      el.style.top = '0';
      el.style.zIndex = 15; // in front of the terminal (10) while it flies past
      el.classList.add('smashed-piece');
      const body = addBody({
        el,
        x: rect.left,
        y: rect.top,
        w: rect.width,
        h: rect.height,
        vx: -1300 - Math.random() * 500,
        vy: -80 + Math.random() * 160,
        exit: true,
      });
      cleanup.bodies.push(body);
    });

    primaryCtaRef.current?.vanish(-1400 - Math.random() * 400, -60);
    resumeRef.current?.vanish(-1400 - Math.random() * 400, 60);

    // FLIP: snap the grid to its final layout instantly (one cheap reflow)
    // instead of animating grid-template-columns frame-by-frame, which
    // forced the whole terminal to reflow on every tick and caused real
    // jank. We fake the same growth with a compositor-only transform:
    // scale the wrapper down to its old width, then transition it back to
    // scaleX(1); a counter-scaled inner wrapper cancels the horizontal
    // squish so the terminal's own text never distorts.
    const firstWidth = flipOuter.getBoundingClientRect().width;
    inner.classList.add('term-expanded');
    const lastWidth = flipOuter.getBoundingClientRect().width;
    const scale = firstWidth / lastWidth;

    // clip only while the transform is in flight so .term's resting
    // box-shadow isn't cropped once things settle
    flipOuter.classList.add('flip-clip');
    flipOuter.style.transition = 'none';
    flipOuter.style.transformOrigin = 'right center';
    flipOuter.style.transform = `scaleX(${scale})`;
    flipInner.style.transition = 'none';
    flipInner.style.transformOrigin = 'right center';
    flipInner.style.transform = `scaleX(${1 / scale})`;
    // commit the "before" transform in its own paint, or the two states
    // collapse into one and nothing animates
    flipOuter.getBoundingClientRect();

    flipOuter.addEventListener(
      'transitionend',
      () => flipOuter.classList.remove('flip-clip'),
      { once: true },
    );

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        flipOuter.style.transition = 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)';
        flipOuter.style.transform = 'scaleX(1)';
        flipInner.style.transition = 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)';
        flipInner.style.transform = 'scaleX(1)';
      });
    });

    setSmashed(true);
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
              <span data-smash="drop">. I&apos;ve entered two hackathons and won </span>
              <span className="highlight" data-smash="chunk">first place at one</span>
              <span data-smash="drop">, plus took </span>
              <span className="highlight" data-smash="chunk">first in the OSU AI Club project competition</span>
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
          <div ref={termFlipOuterRef} className="term-flip-outer">
            <div ref={termFlipInnerRef} className="term-flip-inner">
              <Terminal onSend={handleTerminalSend} />
              <div className="operator">
                <img src={profile.photo} alt={`${profile.name}, ${profile.title}`} />
                <p className="op-text">
                  <b>operator:</b> ethan harter · corvallis, or
                  <br />
                  <b>uptime:</b> senior year · graduating june 2027
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
