/**
 * Turns "/images/ducks.svg" into a URL that works whether the app is served
 * from the domain root ("/") or a sub-path ("/transformation-assignments/" on
 * GitHub Pages). Vite sets BASE_URL from the `base` option.
 */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
