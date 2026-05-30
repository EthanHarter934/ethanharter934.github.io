import { useCallback, useEffect, useState } from 'react';

export default function useIntersectionObserver({
  threshold = 0.15,
  root = null,
  rootMargin = '0px',
  once = true,
} = {}) {
  const [element, setElement] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const setRef = useCallback((node) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element || (once && isVisible)) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);

          if (once) {
            observer.disconnect();
          }
          return;
        }

        if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, root, rootMargin },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [element, isVisible, once, root, rootMargin, threshold]);

  return [setRef, isVisible];
}