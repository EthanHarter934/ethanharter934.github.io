import { experience } from '../data/portfolio';
import RichText from './RichText';
import useIntersectionObserver from '../hooks/useIntersectionObserver';

function ExperienceItem({ item, delay }) {
  const [setItemRef, isVisible] = useIntersectionObserver();

  return (
    <div
      className={`section-item reveal ${isVisible ? 'visible' : ''}`}
      ref={setItemRef}
      style={{ '--reveal-delay': `${delay}ms` }}
    >
      <div className="item-header">
        <h3>{item.title}</h3>
        <span className="item-date">{item.date}</span>
      </div>
      <p>
        <RichText segments={item.description} />
      </p>
    </div>
  );
}

export default function Experience() {
  const [setHeadingRef, isVisible] = useIntersectionObserver();

  return (
    <section id="experience">
      <h2 ref={setHeadingRef} className={`reveal ${isVisible ? 'visible' : ''}`}>
        Experience
      </h2>
      {experience.map((item, index) => (
        <ExperienceItem key={item.title} item={item} delay={index * 80} />
      ))}
    </section>
  );
}
