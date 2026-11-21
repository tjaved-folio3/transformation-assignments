import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/  ·  https://vitest.dev/config/
export default defineConfig({
  // "/" locally; the deploy job sets VITE_BASE=/<repo-name>/ for GitHub Pages.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Vitest runs with MODE=test, so the mock API answers with no artificial delay.
    restoreMocks: true,
  },
});
