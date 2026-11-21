import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS !== 'false';

/**
 * Starts the MSW Service Worker BEFORE React renders, so the very first
 * fetch() is already intercepted. Loaded with a dynamic import so the mock
 * code is left out of the bundle when mocks are turned off.
 */
async function enableMocking() {
  if (!mocksEnabled) return;
  const { worker } = await import('./mocks/browser.ts');
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root is missing from index.html');
}

void enableMocking().then(() => {
  createRoot(rootElement).render(
    <StrictMode>
      <App mocksEnabled={mocksEnabled} />
    </StrictMode>,
  );
});
