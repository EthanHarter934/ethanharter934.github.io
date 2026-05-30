import { profile, navLinks, contactLinks } from '../data/portfolio';

export default function Sidebar({ onNavClick, onChatClick }) {
  return (
    <div className="sidebar">
      <img src={profile.photo} alt={profile.name} />
      <h1>{profile.name}</h1>
      <p>{profile.title}</p>
      <p>{profile.school}</p>

      <nav className="table-of-contents">
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={(event) => onNavClick(event, link.href)}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <button type="button" className="sidebar-chat-button" onClick={onChatClick}>
        <span className="sidebar-chat-button-icon">✦</span>
        <span className="sidebar-chat-button-text">Chat with AI</span>
      </button>

      <div className="contact-bar">
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
    </div>
  );
}
