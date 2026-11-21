import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

/**
 * In a single-page app, clicking a link swaps the content but keyboard focus
 * stays on the old link and screen readers hear nothing. After each PAGE change
 * (pathname, not filter changes in ?query), move focus to <main> so the next Tab
 * starts at the new content and the new page is announced.
 */
export function RouteFocus() {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false; // on first load, the browser already starts at the top
      return;
    }
    document.getElementById('main')?.focus();
  }, [pathname]);

  return null;
}
