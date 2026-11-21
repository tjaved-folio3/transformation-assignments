import { lazy, Suspense } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './router.tsx';

// Loaded only when mocks are on, so it never ships to a real deployment.
const DevPanel = lazy(() => import('./mocks/DevPanel.tsx').then((module) => ({ default: module.DevPanel })));

type AppProps = {
  mocksEnabled: boolean;
};

function App({ mocksEnabled }: AppProps) {
  return (
    <>
      <RouterProvider router={router} />
      {mocksEnabled && (
        <Suspense fallback={null}>
          <DevPanel />
        </Suspense>
      )}
    </>
  );
}

export default App;
