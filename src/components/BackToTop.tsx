import { useEffect, useState } from 'react';

const SHOW_AFTER_PX = 600;

/**
 * Appears after scrolling down; scrolls back to the top when clicked.
 *
 * D2-4 cleanup: the scroll listener is added when the component mounts and
 * REMOVED in the cleanup function when it unmounts. Without the cleanup,
 * every visit to a page would add another listener that keeps running (and
 * keeps calling setState on a component that no longer exists): a memory leak.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      // React skips the re-render when the value didn't change, so this is cheap.
      setVisible(window.scrollY > SHOW_AFTER_PX);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="back-to-top button"
      onClick={() => {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        // Move keyboard focus back to the top of the page content too.
        document.getElementById('main')?.focus({ preventScroll: true });
      }}
    >
      ↑ Back to top
    </button>
  );
}
