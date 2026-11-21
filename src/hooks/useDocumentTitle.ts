import { useEffect } from 'react';

const SITE_NAME = 'The Bug Bazaar';

/**
 * Sets the browser tab title for the current page. Screen readers announce the
 * title on navigation, so every page needs a distinct, descriptive one.
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  }, [title]);
}
