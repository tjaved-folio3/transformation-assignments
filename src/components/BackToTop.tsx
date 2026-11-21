import { useScrolledPast } from '../hooks/useScrolledPast.ts';

const SHOW_AFTER_PX = 600;

/**
 * Appears after scrolling down; scrolls back to the top when clicked.
 * The scroll listener (and its cleanup) lives in the useScrolledPast hook.
 */
export function BackToTop() {
  const visible = useScrolledPast(SHOW_AFTER_PX);
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
