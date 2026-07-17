import { contactLinks, profile } from '../data/portfolio';
import { uiClick } from '../utils/sfx';
import Reveal from './Reveal';
import Throwable from './Throwable';
import { SocialIcon } from './Icons';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="footer">
      <div className="footer-inner container">
        <Reveal y={14}>
          <p className="section-eyebrow">say hello</p>
        </Reveal>

        <Reveal delay={0.08} y={22}>
          <h2 className="footer-title">
            Let&apos;s build <span className="acc">something.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.16} y={18}>
          <p className="footer-sub">
            I&apos;m looking for internships and cool things to build in AI and software engineering.
            If you&apos;re hiring, or just want to nerd out about AI and machine learning, my inbox is open.
          </p>
        </Reveal>

        <Reveal delay={0.24} y={16} className="footer-email-wrap">
          <Throwable>
            <a
              href={`mailto:${profile.email}`}
              className="btn-primary footer-email"
              onClick={() => uiClick()}
            >
              {profile.email} <span aria-hidden="true">↗</span>
            </a>
          </Throwable>
        </Reveal>

        <Reveal delay={0.3} y={14}>
          <div className="footer-socials">
            {contactLinks.map((link) => (
              <Throwable key={link.kind}>
                <a
                  href={link.href}
                  className="social-link"
                  aria-label={link.label}
                  title={link.label}
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                  onClick={() => uiClick()}
                >
                  <SocialIcon kind={link.kind} />
                </a>
              </Throwable>
            ))}
          </div>
        </Reveal>

        <p className="footer-note">
          <b>ethan.harter</b> © {year}
          <span aria-hidden="true">·</span> corvallis, or
          <span aria-hidden="true">·</span> pull the chain for lights
          <span aria-hidden="true">·</span> the buttons are throwable, btw
        </p>
      </div>
    </footer>
  );
}
