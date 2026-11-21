// Types for our VITE_* environment variables (see .env.example).
interface ImportMetaEnv {
  /** Base URL for API calls. Defaults to "/api". */
  readonly VITE_API_BASE_URL?: string;
  /** Set to "false" to turn off the MSW mock API (e.g. when a real backend exists). */
  readonly VITE_ENABLE_MOCKS?: string;
  /** WebSocket URL for live stock updates. */
  readonly VITE_LIVE_STOCK_URL?: string;
}
