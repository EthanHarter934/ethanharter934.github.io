import { useRef, useState } from 'react';
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { handleNavClick } = useScrollToSection(mainRef);

  const handleSidebarNavClick = (event, href) => {
    setIsChatOpen(false);
    handleNavClick(event, href);
  };

  return (
    <>
      <Sidebar
        onNavClick={handleSidebarNavClick}
        onChatClick={() => setIsChatOpen((open) => !open)}
      />
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
        {isChatOpen && <ChatWidget />}
      </div>
    </>
  );
}
