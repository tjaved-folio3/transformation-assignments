/**
 * The state of one network request, as a *discriminated union*.
 *
 * Each variant has a different `status` value (the "discriminant"). TypeScript
 * uses it to know which other fields exist, so impossible combinations such as
 * "loading AND has an error" or "success but no data" cannot be written.
 *
 *   if (state.status === 'success') state.data   // OK: data exists here
 *   if (state.status === 'loading') state.data   // compile error
 */
export type RequestState<T> =
  { status: 'idle' } | { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: unknown };
