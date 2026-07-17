import { education, experience } from '../data/portfolio';
import RichText from './RichText';
import Reveal from './Reveal';
import SectionHeader from './SectionHeader';

export default function Background() {
  return (
    <section id="background" className="section">
      <div className="container">
        <SectionHeader label="training data" title="Background" />

        <div className="background-grid">
          <Reveal>
            <p className="bg-col-label">Education</p>
            <div className="bg-card">
              <div className="bg-card-header">
                <h3>{education.institution}</h3>
                <span className="bg-date">{education.date}</span>
              </div>
              <p>{education.degree}</p>
              <p className="gpa-flag">
                <span aria-hidden="true">▲</span> {education.gpa}
              </p>
              <div className="class-chips">
                {education.notableClasses.map((course) => (
                  <span key={course} className="class-chip">
                    {course}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="bg-col-label">Experience</p>
            {experience.map((item) => (
              <div key={item.title} className="bg-card">
                <div className="bg-card-header">
                  <h3>{item.title}</h3>
                  <span className="bg-date">{item.date}</span>
                </div>
                <p>
                  <RichText segments={item.description} />
                </p>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
