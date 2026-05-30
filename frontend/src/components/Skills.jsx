import { skills } from '../data/portfolio';
import useIntersectionObserver from '../hooks/useIntersectionObserver';

function ScrollingList({ items, direction }) {
  return (
    <div className="marquee">
      <div className={`marquee-track ${direction === 'left' ? 'marquee-left' : 'marquee-right'}`}>
        <ul className="marquee-group">
          {items.map((item) => (
            <li key={`${item}-a`}>{item}</li>
          ))}
        </ul>
        <ul className="marquee-group" aria-hidden="true">
          {items.map((item) => (
            <li key={`${item}-b`}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Skills() {
  const [setHeadingRef, isHeadingVisible] = useIntersectionObserver();
  const [setLanguagesRef, areLanguagesVisible] = useIntersectionObserver();
  const [setToolsRef, areToolsVisible] = useIntersectionObserver();

  return (
    <section id="skills">
      <h2 ref={setHeadingRef} className={`reveal ${isHeadingVisible ? 'visible' : ''}`}>
        Technical Skills & Tools
      </h2>

      <div
        ref={setLanguagesRef}
        className={`skills-section-item reveal ${areLanguagesVisible ? 'visible' : ''}`}
      >
        <h3>Languages:</h3>
        <ScrollingList items={skills.languages} direction="left" />
      </div>

      <div
        ref={setToolsRef}
        className={`skills-section-item reveal ${areToolsVisible ? 'visible' : ''}`}
      >
        <h3>Tools:</h3>
        <ScrollingList items={skills.tools} direction="right" />
      </div>
    </section>
  );
}
