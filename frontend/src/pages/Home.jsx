import { useRef, useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Education from '../components/Education';
import Skills from '../components/Skills';
import Experience from '../components/Experience';
import Projects from '../components/Projects';
import Awards from '../components/Awards';
import Extracurriculars from '../components/Extracurriculars';
import ContactBar from '../components/ContactBar';
import ChatWidget from '../components/ChatWidget';
import useScrollToSection from '../hooks/useScrollToSection';

export default function Home() {
  const mainRef = useRef(null);
  const sidebarRef = useRef(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { handleNavClick } = useScrollToSection(mainRef);

  const handleSidebarNavClick = (event, href) => {
    setIsChatOpen(false);
    setIsMobileMenuOpen(false);
    handleNavClick(event, href);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  return (
    <div className={`home-container ${isChatOpen ? 'chat-open' : ''}`}>
      <div ref={sidebarRef} className="sidebar-wrapper">
        <Sidebar
          onNavClick={handleSidebarNavClick}
          onChatClick={() => {
            setIsChatOpen((open) => !open);
            setIsMobileMenuOpen(false);
          }}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
      </div>
      <div className={`main ${isChatOpen ? 'main-chat-open' : ''}`} ref={mainRef}>
        <div className={`main-content ${isChatOpen ? 'main-content-hidden' : ''}`}>
          <Education />
          <Skills />
          <Experience />
          <Projects />
          <Awards />
          <Extracurriculars />
          <ContactBar />
        </div>
        {isChatOpen && <ChatWidget onClose={() => setIsChatOpen(false)} />}
      </div>
    </div>
  );
}
