/** Dev-only route (/debug/crash) that throws during render, to test the error boundary (D4-7). */
export function CrashTest(): never {
  throw new Error('Crash test: a component threw while rendering');
}
