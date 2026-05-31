import { useCallback } from 'react';

export default function useScrollToSection(mainRef) {
  const scrollToSection = useCallback(
    (selector) => {
      const element = document.querySelector(selector);
      if (!element) return;

      const container = mainRef.current;
      const isMainScrollable = container && container.scrollHeight > container.clientHeight;

      if (isMainScrollable) {
        const headerOffset = 45;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition - headerOffset + container.scrollTop;

        container.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      } else {
        const headerOffset = 45;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = window.scrollY + elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
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
