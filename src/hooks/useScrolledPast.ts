import { useEffect, useState } from 'react';

/**
 * True once the page is scrolled further than `offsetPx`.
 * Used by the Back to Top button and by the header's shadow, which used to
 * each have their own copy of this listener code.
 *
 * The scroll listener is removed in the cleanup, so it stops when the
 * component using the hook unmounts.
 */
export function useScrolledPast(offsetPx: number): boolean {
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    function handleScroll() {
      // Setting the same boolean again doesn't re-render, so this stays cheap
      // even though scroll events fire many times per second.
      setScrolledPast(window.scrollY > offsetPx);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [offsetPx]);

  return scrolledPast;
}
