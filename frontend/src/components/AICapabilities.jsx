import { useRef } from 'react';
import { aiCapabilities } from '../data/portfolio';
import Reveal from './Reveal';
import SectionHeader from './SectionHeader';

// AI capability cards: same spotlight-glow border + lift as the work
// cards, staggered in on scroll.
function AICard({ item, index }) {
  const cardRef = useRef(null);

  const handlePointerMove = (event) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--gx', `${event.clientX - rect.left}px`);
    card.style.setProperty('--gy', `${event.clientY - rect.top}px`);
  };

  return (
    <Reveal className="ai-cell" delay={(index % 2) * 0.06 + Math.floor(index / 2) * 0.05} y={18}>
      <article ref={cardRef} className="glow-card ai-card" onPointerMove={handlePointerMove}>
        <span className="ai-card-num" aria-hidden="true">{`0${index + 1}`}</span>
        <h3 className="ai-card-title">{item.title}</h3>
        <p className="ai-card-desc">{item.description}</p>
        <ul className="ai-card-chips">
          {item.chips.map((chip) => (
            <li key={chip}>
              <span className="skill-chip">{chip}</span>
            </li>
          ))}
        </ul>
      </article>
    </Reveal>
  );
}

export default function AICapabilities() {
  return (
    <section id="ai" className="section">
      <div className="container">
        <SectionHeader label="ai/ml" title="What I do with AI" />
        <div className="ai-grid">
          {aiCapabilities.map((item, index) => (
            <AICard key={item.title} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
