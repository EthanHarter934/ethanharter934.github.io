import { awards } from '../data/portfolio';
import Reveal from './Reveal';
import SectionHeader from './SectionHeader';

export default function Awards() {
  return (
    <section id="recognition" className="section">
      <div className="container">
        <SectionHeader label="validation log" title="Recognition" />

        <div className="awards-timeline">
          {awards.map((award, index) => (
            <Reveal
              key={award.title}
              className={`award-item ${award.gold ? 'gold' : ''}`}
              delay={Math.min(index * 0.06, 0.24)}
              y={20}
            >
              <p className="award-date">{award.date}</p>
              <h3 className="award-title">{award.title}</h3>
              <p className="award-desc">{award.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
