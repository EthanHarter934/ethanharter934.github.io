import { profile, navLinks, contactLinks } from '../data/portfolio';

export default function Sidebar({ onNavClick, onChatClick, isMobileMenuOpen, setIsMobileMenuOpen }) {
  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <img src={profile.photo} alt={profile.name} />
        <h1>{profile.name}</h1>
        <p>{profile.title}</p>
        <p>{profile.school}</p>

        <button
          type="button"
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active-menu' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Menu"
        >
          <i>Menu</i>
        </button>

        {isMobileMenuOpen && (
          <div className="mobile-menu open">
            <button
              type="button"
              className="mobile-chat-btn"
              onClick={() => {
                onChatClick();
                setIsMobileMenuOpen(false);
              }}
            >
              Chat with AI
            </button>

            <nav className="mobile-nav">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(event) => {
                    onNavClick(event, link.href);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        )}

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
      </div>

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
