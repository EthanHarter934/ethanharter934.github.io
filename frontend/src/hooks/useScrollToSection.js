import { useCallback } from 'react';

export default function useScrollToSection(mainRef) {
  const scrollToSection = useCallback(
    (selector) => {
      const element = document.querySelector(selector);
      const container = mainRef.current;
      if (!element || !container) return;

      const headerOffset = 45;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition - headerOffset + container.scrollTop;

      container.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    },
    [mainRef],
  );

  const handleNavClick = useCallback(
    (event, href) => {
      event.preventDefault();
      scrollToSection(href);
    },
    [scrollToSection],
  );

  return { handleNavClick };
}
