import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'public/mockServiceWorker.js']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      // D1-3: no escape hatches from the type checker.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // D1-4: components never make network calls directly. Only the data layer
    // (src/api/client.ts), the mock server and tests may use fetch/XMLHttpRequest.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/api/client.ts', 'src/mocks/**', '**/*.test.{ts,tsx}', 'src/test/**'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Use the data layer in src/api/ instead of calling fetch directly.' },
        { name: 'XMLHttpRequest', message: 'Use the data layer in src/api/ instead.' },
      ],
    },
  },
  // Must stay last: turns off style rules that Prettier owns.
  prettier,
]);
