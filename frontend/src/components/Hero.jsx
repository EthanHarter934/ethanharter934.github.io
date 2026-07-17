import { profile } from '../data/portfolio';
import Reveal from './Reveal';
import Magnetic from './Magnetic';
import Terminal from './Terminal';
import Throwable from './Throwable';

export default function Hero() {
  const handleWorkClick = (event) => {
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
              I teach machines <span className="acc">to see.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.14} y={22}>
            <p className="hero-lede">
              I&apos;m <strong>Ethan Harter</strong>, a CS student at Oregon State who spends a lot of
              time getting computers to recognize things. I&apos;ve entered two hackathons so far and{' '}
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
              <Throwable>
                <Magnetic>
                  <a href="#work" className="btn-primary" onClick={handleWorkClick}>
                    See the work <span aria-hidden="true">→</span>
                  </a>
                </Magnetic>
              </Throwable>
              <a
                href="/CS_AI Resume.pdf"
                target="_blank"
                rel="noreferrer"
                className="btn-quiet link-sweep"
              >
                résumé ↗
              </a>
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
              <b>uptime:</b> junior year · graduating june 2027
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
