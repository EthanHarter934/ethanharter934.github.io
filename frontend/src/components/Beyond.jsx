import { extracurriculars } from '../data/portfolio';
import Reveal from './Reveal';
import SectionHeader from './SectionHeader';

export default function Beyond() {
  return (
    <section id="beyond" className="section">
      <div className="container">
        <SectionHeader label="off duty" title="Beyond the terminal" />

        <div className="beyond-chips">
          {extracurriculars.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.07} y={16}>
              <div className="beyond-chip">
                <p className="beyond-title">{item.title}</p>
                <p className="beyond-date">{item.date}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
