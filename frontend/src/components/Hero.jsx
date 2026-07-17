import { useRef, useState } from 'react';
import { profile } from '../data/portfolio';
import { ensureAudio, grab, uiClick, whomp } from '../utils/sfx';
import { addBody, beginDrag, clearEdge, setEdge } from '../utils/physicsWorld';
import Reveal from './Reveal';
import Terminal from './Terminal';
import Throwable from './Throwable';

export default function Hero() {
  const smashedRef = useRef(false);
  const [smashed, setSmashed] = useState(false);
  const heroInnerRef = useRef(null);
  const primaryCtaRef = useRef(null);
  const resumeRef = useRef(null);

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

    const pieces = ['.hero-eyebrow', '.hero-title', '.hero-lede', '.hero-meta']
      .map((sel) => copy.querySelector(sel))
      .filter(Boolean);

    whomp();

    for (const el of pieces) {
      const rect = el.getBoundingClientRect();
      el.style.width = `${rect.width}px`;
      el.style.margin = '0';
      el.style.position = 'fixed';
      el.style.left = '0';
      el.style.top = '0';
      el.style.zIndex = 390;
      el.classList.add('smashed-piece');
      const body = addBody({
        el,
        x: rect.left,
        y: rect.top,
        w: rect.width,
        h: rect.height,
        vx: -80,
        vy: -60,
      });
      el.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        ensureAudio();
        grab();
        beginDrag(body, event.clientX, event.clientY);
      });
    }

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
            <p className="hero-eyebrow">
              <span className="dot" aria-hidden="true" />
              open to internships &amp; software roles
            </p>
          </Reveal>

          <Reveal delay={0.07} y={22}>
            <h1 className="hero-title">
              Turning ideas into <span className="acc">code I trust.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.14} y={22}>
            <p className="hero-lede">
              I&apos;m <strong>Ethan Harter</strong>, a CS student at Oregon State who spends a lot of
              time building and training AI systems. I&apos;ve entered two hackathons so far and{' '}
              <span className="highlight">won first place at both</span>.
            </p>
          </Reveal>

          <Reveal delay={0.21} y={18}>
            <div className="hero-meta">
              {profile.stats.map((stat) => (
                <div key={stat.label} className="hm">
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
