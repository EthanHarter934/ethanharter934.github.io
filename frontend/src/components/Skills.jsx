import { skills } from '../data/portfolio';

function ScrollingList({ items, direction }) {
  const repeatedItems = [...items, ...items, ...items];

  return (
    <div className="scrolling-container">
      <ul className={direction === 'left' ? 'right-to-left' : 'left-to-right'}>
        {repeatedItems.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function Skills() {
  return (
    <section id="skills">
      <h2>Technical Skills & Tools</h2>

      <div className="skills-section-item">
        <h3>Languages:</h3>
        <ScrollingList items={skills.languages} direction="left" />
      </div>

      <div className="skills-section-item">
        <h3>Tools:</h3>
        <ScrollingList items={skills.tools} direction="right" />
      </div>
    </section>
  );
}
