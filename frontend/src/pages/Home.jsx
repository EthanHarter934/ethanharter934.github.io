import { useCallback, useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import Navbar from '../components/Navbar';
import PullChain from '../components/PullChain';
import Hero from '../components/Hero';
import Projects from '../components/Projects';
import Skills from '../components/Skills';
import Background from '../components/Background';
import Awards from '../components/Awards';
import Beyond from '../components/Beyond';
import Footer from '../components/Footer';

function getInitialTheme() {
  if (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light') {
    return 'light';
  }
  return 'dark';
}

export default function Home() {
  const [theme, setTheme] = useState(getInitialTheme);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.dataset.theme = 'light';
    } else {
      delete document.documentElement.dataset.theme;
    }
    try {
      localStorage.setItem('eh-theme', theme);
    } catch {
      // private mode — theme just won't persist
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'light' ? '#f2ede3' : '#0c0e10';
  }, [theme]);

  return (
    <MotionConfig reducedMotion="user">
      <Navbar />
      <PullChain onToggle={toggleTheme} theme={theme} />

      <main>
        <Hero />
        <Projects />
        <Skills />
        <Background />
        <Awards />
        <Beyond />
      </main>

      <Footer />
    </MotionConfig>
  );
}
