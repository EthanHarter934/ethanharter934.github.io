import { education } from '../data/portfolio';
import useIntersectionObserver from '../hooks/useIntersectionObserver';

function EducationEntry() {
  const [setEntryRef, isVisible] = useIntersectionObserver();

  return (
    <div ref={setEntryRef} className={`section-item reveal ${isVisible ? 'visible' : ''}`}>
      <div className="item-header">
        <h3>{education.institution}</h3>
        <span className="item-date">{education.date}</span>
      </div>
      <p>{education.degree}</p>
      <p>{education.notableClasses}</p>
    </div>
  );
}

export default function Education() {
  const [setHeadingRef, isVisible] = useIntersectionObserver();

  return (
    <section id="education">
      <h2 ref={setHeadingRef} className={`reveal ${isVisible ? 'visible' : ''}`}>
        Education
      </h2>
      <EducationEntry />
    </section>
  );
}
