import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    setupFiles: ['./src/vitest.setup.ts'],
    testTimeout: 20_000,
    include: ['src/**/*.test.ts'],
    exclude: [...configDefaults.exclude, '**/mysql/**'],
    env: {
      NODE_ENV: 'production',
    },
    coverage: {
      reporter: ['text', 'json-summary'],
      exclude: ['src/db/postgres/Schema.ts', 'src/Main.ts', 'src/solver/browser/fetchBrowser.ts'],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
  },
});
