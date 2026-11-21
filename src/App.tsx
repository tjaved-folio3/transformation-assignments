import { lazy, Suspense } from 'react';
import { flushSync } from 'react-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router';
import { ErrorFallback } from './components/ErrorFallback.tsx';
import { logError } from './monitoring/logger.ts';
import { router } from './router.tsx';
import { store } from './store/store.ts';

// Loaded only when mocks are on, so it never ships to a real deployment.
const DevPanel = lazy(() => import('./mocks/DevPanel.tsx').then((module) => ({ default: module.DevPanel })));

type AppProps = {
  mocksEnabled: boolean;
};

function App({ mocksEnabled }: AppProps) {
  return (
    // Last line of defense (D4-7): anything that escapes the router's own
    // error handling (the Provider, the Dev panel…) still shows a fallback and is logged.
    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => <ErrorFallback onReset={resetErrorBoundary} />}
      onError={(error, info) => logError(error, 'react-root', info.componentStack ?? undefined)}
    >
      {/* <Provider> makes the Redux store available to every component below it. */}
      <Provider store={store}>
        {/* flushSync lets navigate(..., { flushSync: true }) commit immediately (used by checkout). */}
        <RouterProvider router={router} flushSync={(update) => void flushSync(update)} />
        {mocksEnabled && (
          <Suspense fallback={null}>
            <DevPanel />
          </Suspense>
        )}
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
