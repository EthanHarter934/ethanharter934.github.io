import { projects } from '../data/portfolio';
import RichText from './RichText';
import useIntersectionObserver from '../hooks/useIntersectionObserver';

function ProjectItem({ project, delay }) {
  const [setProjectRef, isVisible] = useIntersectionObserver();

  return (
    <div
      className={`project-item reveal ${isVisible ? 'visible' : ''}`}
      ref={setProjectRef}
      style={{ '--reveal-delay': `${delay}ms` }}
    >
      <div className="project-header">
        <h3>{project.title}</h3>
        <span className="project-date">{project.date}</span>
      </div>
      <div className="project-content">
        <div className="project-image-wrapper">
          <img src={project.image} alt={project.alt} className="project-image" />
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="project-github-link"
          >
            <img src="/Images/github-icon.png" alt="GitHub" className="github-overlay" />
          </a>
        </div>
        <p>
          <RichText segments={project.description} />
        </p>
      </div>
    </div>
  );
}

export default function Projects() {
  const [setHeadingRef, isVisible] = useIntersectionObserver();

  return (
    <section id="projects">
      <h2 ref={setHeadingRef} className={`reveal ${isVisible ? 'visible' : ''}`}>
        Projects
      </h2>

      {projects.map((project, index) => (
        <ProjectItem key={project.title} project={project} delay={index * 80} />
      ))}
    </section>
  );
}
