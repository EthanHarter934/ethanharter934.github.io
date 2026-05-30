import { extracurriculars } from '../data/portfolio';

export default function Extracurriculars() {
  return (
    <section id="extracurriculars">
      <h2>Extracurriculars</h2>
      <div className="section-item">
        {extracurriculars.map((item) => (
          <div className="item-header" key={item.title}>
            <h3>{item.title}</h3>
            <span className="item-date">{item.date}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
