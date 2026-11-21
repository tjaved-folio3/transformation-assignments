import { lazy, Suspense } from 'react';
import './App.css';

// Loaded only when mocks are on, so it never ships to a real deployment.
const DevPanel = lazy(() => import('./mocks/DevPanel.tsx').then((module) => ({ default: module.DevPanel })));

type AppProps = {
  mocksEnabled: boolean;
};

// Temporary placeholder. Day 2 (D2-1) replaces it with the router and real pages.
function App({ mocksEnabled }: AppProps) {
  return (
    <>
      <main>
        <h1>The Bug Bazaar</h1>
        <p>Developer gear for people who ship: rubber ducks, keyboards, and coffee.</p>
      </main>
      {mocksEnabled && (
        <Suspense fallback={null}>
          <DevPanel />
        </Suspense>
      )}
    </>
  );
}

export default App;
