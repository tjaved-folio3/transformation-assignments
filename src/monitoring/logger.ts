/**
 * D4-7: the single place errors are reported.
 *
 * Today it writes a structured entry to the console and keeps the last 50 in
 * memory (handy for debugging and tests). In production this function would
 * forward the same payload to an error-tracking service (Sentry, Datadog, …),
 * so swapping providers means changing this file only.
 */

export type ErrorReport = {
  message: string;
  name: string;
  stack?: string;
  /** Where it happened: "react-render", "route", "unhandled-rejection", … */
  source: string;
  componentStack?: string;
  url: string;
  timestamp: string;
};

const MAX_REPORTS = 50;
const reports: ErrorReport[] = [];
/** The same error can reach us twice (StrictMode re-runs effects; a boundary and window both see it). */
const alreadyLogged = new WeakSet<object>();

export function logError(error: unknown, source: string, componentStack?: string): ErrorReport | undefined {
  if (typeof error === 'object' && error !== null) {
    if (alreadyLogged.has(error)) return undefined;
    alreadyLogged.add(error);
  }
  const asError = error instanceof Error ? error : new Error(String(error));
  const report: ErrorReport = {
    message: asError.message,
    name: asError.name,
    stack: asError.stack,
    source,
    componentStack: componentStack ?? undefined,
    url: window.location.href,
    timestamp: new Date().toISOString(),
  };
  reports.push(report);
  if (reports.length > MAX_REPORTS) reports.shift();
  if (import.meta.env.MODE !== 'test') console.error('[bug-bazaar] error reported', report);
  return report;
}

export function getErrorReports(): readonly ErrorReport[] {
  return reports;
}

/** Catches errors that never reach a React error boundary (timers, promises, event handlers). */
export function installGlobalErrorHandlers() {
  window.addEventListener('error', (event) => logError(event.error ?? event.message, 'window-error'));
  window.addEventListener('unhandledrejection', (event) => logError(event.reason, 'unhandled-rejection'));
}
