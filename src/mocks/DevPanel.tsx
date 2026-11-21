import { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.ts';
import { db } from './db.ts';
import { dropLiveStockConnections } from './liveStock.ts';
import {
  LATENCY_MODES,
  MOCK_SCENARIOS,
  MOCK_SETTINGS_KEY,
  parseMockSettings,
  type LatencyMode,
  type MockScenario,
  type MockSettings,
} from './settings.ts';

const scenarioKeys = Object.keys(MOCK_SCENARIOS) as MockScenario[];
const latencyKeys = Object.keys(LATENCY_MODES) as LatencyMode[];

/**
 * A small floating panel (only when mocks are on) for triggering API errors and
 * slow responses on purpose. Settings go to localStorage, where the mock
 * handlers read them on every request.
 */
export function DevPanel() {
  // Saved to localStorage, where the mock handlers read it on every request.
  const [settings, update] = useLocalStorage<MockSettings>(MOCK_SETTINGS_KEY, parseMockSettings);
  const [note, setNote] = useState('');

  function toggleScenario(scenario: MockScenario) {
    const scenarios = settings.scenarios.includes(scenario)
      ? settings.scenarios.filter((item) => item !== scenario)
      : [...settings.scenarios, scenario];
    update({ ...settings, scenarios });
  }

  return (
    <details className="dev-panel">
      <summary>Mock API controls</summary>
      <fieldset>
        <legend>Force errors</legend>
        {scenarioKeys.map((scenario) => (
          <label key={scenario}>
            <input
              type="checkbox"
              checked={settings.scenarios.includes(scenario)}
              onChange={() => toggleScenario(scenario)}
            />
            {MOCK_SCENARIOS[scenario]}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Network speed</legend>
        {latencyKeys.map((mode) => (
          <label key={mode}>
            <input
              type="radio"
              name="latency"
              checked={settings.latency === mode}
              onChange={() => update({ ...settings, latency: mode })}
            />
            {LATENCY_MODES[mode]}
          </label>
        ))}
      </fieldset>
      <div className="dev-panel__actions">
        <button
          type="button"
          onClick={() => {
            db.expireAllSessions();
            setNote('Sessions expired: the next signed-in request returns 401.');
          }}
        >
          Expire my session (401)
        </button>
        <button
          type="button"
          onClick={() => {
            dropLiveStockConnections();
            setNote('Live stock connection dropped: watch it reconnect.');
          }}
        >
          Drop live connection
        </button>
        <a href={`${import.meta.env.BASE_URL}debug/crash`}>Crash a page (error boundary)</a>
        <button
          type="button"
          onClick={() => {
            db.reset();
            setNote('Mock data reset. Reload the page.');
          }}
        >
          Reset mock data
        </button>
      </div>
      <p role="status" className="dev-panel__note">
        {note}
      </p>
    </details>
  );
}
