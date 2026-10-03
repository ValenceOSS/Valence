import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import {
  changelogContent,
  githubStarsContent,
  pluginCatalogueContent,
  uiCatalogueContent,
} from './vite.config.ts';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    react(),
    changelogContent(),
    githubStarsContent(),
    pluginCatalogueContent(),
    uiCatalogueContent(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    sequence: { hooks: 'list' },
    testTimeout: 20_000,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      reporter: ['text', 'json-summary'],
      thresholds: { lines: 90, functions: 90, branches: 83, statements: 90 },
    },
  },
});
