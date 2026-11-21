import { useEffect, useState, type RefObject } from 'react';

/**
 * Width of an element and its distance from the top of the document, kept up
 * to date with a ResizeObserver (cleaned up on unmount). The virtual grid uses
 * the width to decide how many columns fit, and the offset so the window
 * virtualizer knows where the list starts.
 */
export function useElementGeometry(ref: RefObject<HTMLElement | null>) {
  const [geometry, setGeometry] = useState({ width: 0, top: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setGeometry((previous) => {
        const next = { width: rect.width, top: rect.top + window.scrollY };
        return previous.width === next.width && previous.top === next.top ? previous : next;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return geometry;
}
