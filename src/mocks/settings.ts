/**
 * Mock "chaos" settings: which errors to force and how slow the fake network is.
 * Stored in localStorage so they survive a reload, and read by the mock
 * handlers on every request. The Dev panel (DevPanel.tsx) edits them.
 */

export const MOCK_SCENARIOS = {
  'products-500': 'Product list → 500',
  'product-500': 'Product details → 500',
  'login-500': 'Login → 500',
  'orders-500': 'Place order → 500',
  'orders-500-after-create': 'Place order → order saved, then 500 (retry test)',
  'orders-409': 'Place order → 409 out of stock',
} as const;

export type MockScenario = keyof typeof MOCK_SCENARIOS;

export const LATENCY_MODES = {
  normal: 'Normal (200–400 ms)',
  slow: 'Slow (2 s)',
  random: 'Random (100 ms – 2 s, out of order)',
} as const;

export type LatencyMode = keyof typeof LATENCY_MODES;

export type MockSettings = {
  scenarios: MockScenario[];
  latency: LatencyMode;
};

export const MOCK_SETTINGS_KEY = 'bug-bazaar:mock-settings';

export const DEFAULT_MOCK_SETTINGS: MockSettings = { scenarios: [], latency: 'normal' };

function isMockScenario(value: unknown): value is MockScenario {
  return typeof value === 'string' && Object.hasOwn(MOCK_SCENARIOS, value);
}

function isLatencyMode(value: unknown): value is LatencyMode {
  return typeof value === 'string' && Object.hasOwn(LATENCY_MODES, value);
}

/** Parses stored settings defensively: bad or missing data falls back to defaults. */
export function parseMockSettings(raw: string | null): MockSettings {
  if (!raw) return DEFAULT_MOCK_SETTINGS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_MOCK_SETTINGS;
    const scenarios = 'scenarios' in parsed && Array.isArray(parsed.scenarios) ? parsed.scenarios : [];
    const latency = 'latency' in parsed ? parsed.latency : undefined;
    return {
      scenarios: scenarios.filter(isMockScenario),
      latency: isLatencyMode(latency) ? latency : 'normal',
    };
  } catch {
    return DEFAULT_MOCK_SETTINGS;
  }
}

export function readMockSettings(): MockSettings {
  try {
    return parseMockSettings(localStorage.getItem(MOCK_SETTINGS_KEY));
  } catch {
    return DEFAULT_MOCK_SETTINGS;
  }
}

export function isScenarioOn(scenario: MockScenario): boolean {
  return readMockSettings().scenarios.includes(scenario);
}

/** How long the fake server "thinks" before answering, in milliseconds. */
export function latencyMs(): number {
  if (import.meta.env.MODE === 'test') return 0;
  switch (readMockSettings().latency) {
    case 'slow':
      return 2000;
    case 'random':
      return 100 + Math.floor(Math.random() * 1900);
    case 'normal':
      return 200 + Math.floor(Math.random() * 200);
  }
}
