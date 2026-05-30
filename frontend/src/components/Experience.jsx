import { experience } from '../data/portfolio';
import RichText from './RichText';

export default function Experience() {
  return (
    <section id="experience">
      <h2>Experience</h2>
      {experience.map((item) => (
        <div className="section-item" key={item.title}>
          <div className="item-header">
            <h3>{item.title}</h3>
            <span className="item-date">{item.date}</span>
          </div>
          <p>
            <RichText segments={item.description} />
          </p>
        </div>
      ))}
    </section>
  );
}
