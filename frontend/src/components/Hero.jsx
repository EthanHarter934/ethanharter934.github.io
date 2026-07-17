import { profile } from '../data/portfolio';
import { uiClick } from '../utils/sfx';
import Reveal from './Reveal';
import Terminal from './Terminal';
import Throwable from './Throwable';

export default function Hero() {
  const handleWorkClick = (event) => {
    uiClick();
    event.preventDefault();
    document.querySelector('#work')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero" id="top">
      <div className="hero-inner container">
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
              <Throwable hint="throw me">
                <a href="#work" className="btn-primary" onClick={handleWorkClick}>
                  See the work <span aria-hidden="true">→</span>
                </a>
              </Throwable>
              <Throwable>
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
          <Terminal />
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
