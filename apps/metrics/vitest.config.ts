import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [react()],
  test: {
    globals: true,
    sequence: { hooks: 'list' },
    testTimeout: 20_000,
    projects: [
      {
        extends: true,
        test: {
          name: 'server',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'page',
          environment: 'jsdom',
          setupFiles: ['./vitest.setup.ts'],
          include: ['src/**/*.test.tsx'],
        },
      },
    ],
    coverage: {
      reporter: ['text', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/app/**', 'src/seed/runSeed.ts', 'src/testing/**', '**/*.types.ts'],
      thresholds: { lines: 90, functions: 90, branches: 83, statements: 90 },
    },
  },
});
