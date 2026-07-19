import { useRef } from 'react';
import { projects } from '../data/portfolio';
import RichText from './RichText';
import Reveal from './Reveal';
import SectionHeader from './SectionHeader';
import { GitHubIcon } from './Icons';

// C1 — spotlight glow border follows the cursor; card lifts 4px.
function WorkCard({ project, index }) {
  const cardRef = useRef(null);

  const handlePointerMove = (event) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--gx', `${event.clientX - rect.left}px`);
    card.style.setProperty('--gy', `${event.clientY - rect.top}px`);
  };

  return (
    <Reveal delay={Math.min(index, 1) * 0.06}>
      <article
        ref={cardRef}
        className={`glow-card work-card ${index % 2 ? 'flip' : ''}`}
        onPointerMove={handlePointerMove}
      >
        <div className="work-visual">
          <img src={project.image} alt={project.alt} className="work-image" loading="lazy" />
        </div>

        <div className="work-body">
          <div className="work-meta">
            <span className="work-year">{project.year}</span>
            <span className="meta-divider" aria-hidden="true" />
            <span>{project.stack}</span>
          </div>

          {project.award && (
            <div className="work-award-tag">
              <span aria-hidden="true">◆</span> {project.award}
            </div>
          )}

          <h3 className="work-title">{project.name}</h3>

          <p className="work-desc">
            <RichText segments={project.description} />
          </p>

          {(project.githubUrl || project.paperUrl) && (
            <div className="work-links">
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noreferrer" className="work-link link-sweep">
                  <GitHubIcon /> view code <span className="arrow" aria-hidden="true">↗</span>
                </a>
              )}
              {project.paperUrl && (
                <a href={project.paperUrl} target="_blank" rel="noreferrer" className="work-link link-sweep">
                  read paper <span className="arrow" aria-hidden="true">↗</span>
                </a>
              )}
            </div>
          )}
        </div>
      </article>
    </Reveal>
  );
}

export default function Projects() {
  return (
    <section id="work" className="section">
      <div className="container">
        <SectionHeader label="selected work" title="Built, shipped, awarded." />
        <div className="work-list">
          {projects.map((project, index) => (
            <WorkCard key={project.name} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
