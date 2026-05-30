import { useRef } from 'react';
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
  const { handleNavClick } = useScrollToSection(mainRef);

  return (
    <>
      <Sidebar onNavClick={handleNavClick} />
      <div className="main" ref={mainRef}>
        <Education />
        <Skills />
        <Experience />
        <Projects />
        <Awards />
        <Extracurriculars />
        <ContactBar />
      </div>
      <ChatWidget />
    </>
  );
}
