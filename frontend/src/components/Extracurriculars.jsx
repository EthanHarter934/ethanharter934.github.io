import { extracurriculars } from '../data/portfolio';
import useIntersectionObserver from '../hooks/useIntersectionObserver';

function ExtracurricularItem({ item, delay }) {
  const [setItemRef, isVisible] = useIntersectionObserver();

  return (
    <div
      className={`item-header reveal ${isVisible ? 'visible' : ''}`}
      ref={setItemRef}
      style={{ '--reveal-delay': `${delay}ms` }}
    >
      <h3>{item.title}</h3>
      <span className="item-date">{item.date}</span>
    </div>
  );
}

export default function Extracurriculars() {
  const [setHeadingRef, isVisible] = useIntersectionObserver();

  return (
    <section id="extracurriculars">
      <h2 ref={setHeadingRef} className={`reveal ${isVisible ? 'visible' : ''}`}>
        Extracurriculars
      </h2>
      <div className="section-item">
        {extracurriculars.map((item, index) => (
          <ExtracurricularItem key={item.title} item={item} delay={index * 80} />
        ))}
      </div>
    </section>
  );
}
