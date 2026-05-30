import { awards } from '../data/portfolio';

export default function Awards() {
  return (
    <section id="awards">
      <h2>Awards</h2>
      <div className="section-item">
        {awards.map((award) => (
          <div key={award.title}>
            <div className="item-header">
              <h3>{award.title}</h3>
              <span className="item-date">{award.date}</span>
            </div>
            <p>{award.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
