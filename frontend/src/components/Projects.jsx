import { projects } from '../data/portfolio';
import RichText from './RichText';

export default function Projects() {
  return (
    <section id="projects">
      <h2>Projects</h2>

      {projects.map((project) => (
        <div className="project-item" key={project.title}>
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
                <img
                  src="/Images/github-icon.png"
                  alt="GitHub"
                  className="github-overlay"
                />
              </a>
            </div>
            <p>
              <RichText segments={project.description} />
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
