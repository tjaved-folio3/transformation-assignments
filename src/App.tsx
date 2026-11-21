import { lazy, Suspense } from 'react';
import { flushSync } from 'react-dom';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router';
import { router } from './router.tsx';
import { store } from './store/store.ts';

// Loaded only when mocks are on, so it never ships to a real deployment.
const DevPanel = lazy(() => import('./mocks/DevPanel.tsx').then((module) => ({ default: module.DevPanel })));

type AppProps = {
  mocksEnabled: boolean;
};

function App({ mocksEnabled }: AppProps) {
  return (
    // <Provider> makes the Redux store available to every component below it.
    <Provider store={store}>
      {/* flushSync lets navigate(..., { flushSync: true }) commit immediately (used by checkout). */}
      <RouterProvider router={router} flushSync={(update) => void flushSync(update)} />
      {mocksEnabled && (
        <Suspense fallback={null}>
          <DevPanel />
        </Suspense>
      )}
    </Provider>
  );
}

export default App;
