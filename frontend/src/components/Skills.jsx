import { useEffect, useRef, useState } from 'react';
import { skills } from '../data/portfolio';
import Reveal from './Reveal';
import SectionHeader from './SectionHeader';

const SPEED_PX_PER_S = 46;

// Marquee clipped to the content column with a soft fade at both
// edges. The chip group is cloned until each half of the track covers
// the container, so the loop never shows a gap at any width.
function MarqueeRow({ items, reverse }) {
  const marqueeRef = useRef(null);
  const groupRef = useRef(null);
  const [copies, setCopies] = useState(2);
  const [duration, setDuration] = useState(38);

  useEffect(() => {
    const measure = () => {
      const containerWidth = marqueeRef.current?.clientWidth;
      const groupWidth = groupRef.current?.scrollWidth;
      if (!containerWidth || !groupWidth) return;
      // copies stay even so the translateX(-50%) loop is seamless
      const perHalf = Math.max(1, Math.ceil((containerWidth * 1.15) / groupWidth));
      setCopies(perHalf * 2);
      setDuration((groupWidth * perHalf) / SPEED_PX_PER_S);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [items]);

  return (
    <div className="marquee" ref={marqueeRef}>
      <div
        className={`marquee-track ${reverse ? 'reverse' : ''}`}
        style={{ '--marquee-dur': `${duration}s` }}
      >
        {Array.from({ length: copies }, (_, copy) => (
          <ul
            key={copy}
            className="marquee-group"
            ref={copy === 0 ? groupRef : undefined}
            aria-hidden={copy > 0 || undefined}
          >
            {items.map((item) => (
              <li key={item}>
                <span className="skill-chip">{item}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

export default function Skills() {
  return (
    <section id="skills" className="section">
      <div className="container">
        <SectionHeader label="capabilities" title="Skills & tools" />
        <Reveal className="skills-strips" y={18}>
          <MarqueeRow items={skills.languages} />
          <MarqueeRow items={skills.tools} reverse />
        </Reveal>
      </div>
    </section>
  );
}
