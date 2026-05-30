import { education } from '../data/portfolio';

export default function Education() {
  return (
    <section id="education">
      <h2>Education</h2>
      <div className="section-item">
        <div className="item-header">
          <h3>{education.institution}</h3>
          <span className="item-date">{education.date}</span>
        </div>
        <p>{education.degree}</p>
        <p>{education.notableClasses}</p>
      </div>
    </section>
  );
}
