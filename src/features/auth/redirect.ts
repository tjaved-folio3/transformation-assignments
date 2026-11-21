/**
 * Where to send the user after logging in. The protected page puts its own
 * path into router state as `from`. We only accept same-site paths ("/…"),
 * never full URLs, so nobody can craft a link that logs you in and then
 * bounces you to another website (an "open redirect").
 */
export function readRedirectTarget(state: unknown, fallback = '/account'): string {
  if (typeof state === 'object' && state !== null && 'from' in state && typeof state.from === 'string') {
    const from = state.from;
    if (from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/login')) return from;
  }
  return fallback;
}
