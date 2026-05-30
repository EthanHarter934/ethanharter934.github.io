import { contactLinks } from '../data/portfolio';

export default function ContactBar() {
  return (
    <div className="contact-bar-mobile">
      {contactLinks.map((link) => (
        <a
          key={link.alt}
          href={link.href}
          target={link.href.startsWith('http') ? '_blank' : undefined}
          rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
        >
          <img src={link.icon} alt={link.alt} />
        </a>
      ))}
    </div>
  );
}
