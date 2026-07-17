import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { navLinks, profile } from '../data/portfolio';
import { click } from '../utils/sfx';

const uiClick = () => click(true, 0.35);

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sections = navLinks.map((link) => document.querySelector(link.href)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(`#${entry.target.id}`);
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleNavClick = (event, href) => {
    uiClick();
    event.preventDefault();
    setMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAskClick = () => {
    uiClick();
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => document.getElementById('ask-input')?.focus({ preventScroll: true }), 650);
  };

  const links = navLinks.map((link) => (
    <a
      key={link.href}
      href={link.href}
      className={`nav-link ${activeSection === link.href ? 'active' : ''}`}
      onClick={(event) => handleNavClick(event, link.href)}
    >
      <span className="nav-num">{link.num}</span>
      {link.label}
    </a>
  ));

  const askLink = (
    <button type="button" className="nav-link" onClick={handleAskClick}>
      <span className="nav-num">✦</span>ask my ai
    </button>
  );

  return (
    <>
      <header className={`nav ${scrolled ? 'scrolled' : ''} ${menuOpen ? 'menu-open' : ''}`}>
        <div className="nav-inner container">
          <a
            href="#top"
            className="nav-logo"
            onClick={(event) => {
              uiClick();
              event.preventDefault();
              setMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            ethan<b>.</b>harter
          </a>

          <nav className="nav-links" aria-label="Sections">
            {links}
            {askLink}
          </nav>

          <a className="nav-cta" href={`mailto:${profile.email}`} onClick={uiClick}>
            Get in touch
          </a>

          <button
            type="button"
            className={`nav-burger ${menuOpen ? 'open' : ''}`}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            {links}
            {askLink}
            <a className="nav-cta" href={`mailto:${profile.email}`} onClick={uiClick}>
              Get in touch
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
