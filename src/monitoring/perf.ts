import type { ProfilerOnRenderCallback } from 'react';

/**
 * D4-2: records how long React spends rendering the product grid, using
 * React's built-in <Profiler>. In development the numbers are collected on
 * window.__bugBazaarPerf so a measurement script (or you, in DevTools) can read
 * them. In production builds <Profiler> is a no-op, so this costs nothing there.
 */

type Commit = { id: string; phase: string; actualMs: number; at: number };

declare global {
  interface Window {
    __bugBazaarPerf?: Commit[];
  }
}

export const recordRender: ProfilerOnRenderCallback = (id, phase, actualDuration, _base, startTime) => {
  if (!import.meta.env.DEV) return;
  window.__bugBazaarPerf ??= [];
  window.__bugBazaarPerf.push({ id, phase, actualMs: actualDuration, at: startTime });
};
