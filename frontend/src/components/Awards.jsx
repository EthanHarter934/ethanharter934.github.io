import { awards } from '../data/portfolio';
import useIntersectionObserver from '../hooks/useIntersectionObserver';

function AwardItem({ award, delay }) {
  const [setAwardRef, isVisible] = useIntersectionObserver();

  return (
    <div
      ref={setAwardRef}
      className={`reveal ${isVisible ? 'visible' : ''}`}
      style={{ '--reveal-delay': `${delay}ms` }}
    >
      <div className="item-header">
        <h3>{award.title}</h3>
        <span className="item-date">{award.date}</span>
      </div>
      <p>{award.description}</p>
    </div>
  );
}

export default function Awards() {
  const [setHeadingRef, isVisible] = useIntersectionObserver();

  return (
    <section id="awards">
      <h2 ref={setHeadingRef} className={`reveal ${isVisible ? 'visible' : ''}`}>
        Awards
      </h2>
      <div className="section-item">
        {awards.map((award, index) => (
          <AwardItem key={award.title} award={award} delay={index * 80} />
        ))}
      </div>
    </section>
  );
}
