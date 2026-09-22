import { execFileSync } from 'node:child_process';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const NOT_BUNDLED = [/^electron$/, /^conf$/, /^better-auth(\/.*)?$/, /^@better-auth\/.*/, /^zod$/];

/**
 * The commit this was built from, read once from the checkout doing the building.
 *
 * A packaged app carries no `.git` of its own, so this is the one moment the answer is available at
 * all — baked into the bundle here rather than asked for at runtime, where there would be nothing
 * left to ask.
 *
 * @returns A short hash, or `unknown` where this was built somewhere that has none to give.
 */
const commitBuiltFrom = (): string => {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD']).toString().trim();
  } catch {
    return 'unknown';
  }
};

const DEFINE = { __VALENCE_COMMIT__: JSON.stringify(commitBuiltFrom()) };

export default defineConfig({
  main: {
    resolve: { tsconfigPaths: true },
    define: DEFINE,
    build: {
      outDir: 'dist-main',
      lib: { entry: 'src/main/Main.ts' },
      rollupOptions: { external: NOT_BUNDLED, output: { entryFileNames: 'main/Main.js' } },
    },
  },
  preload: {
    resolve: { tsconfigPaths: true },
    define: DEFINE,
    build: {
      outDir: 'dist-preload',
      lib: { entry: 'src/preload/Preload.ts' },
      rollupOptions: { external: NOT_BUNDLED, output: { entryFileNames: 'preload/Preload.js' } },
    },
  },
  renderer: {
    root: '.',
    resolve: { tsconfigPaths: true },
    plugins: [react(), tailwindcss()],
    server: { hmr: { protocol: 'ws', host: 'localhost', port: 5174 } },
    build: { outDir: 'dist', target: 'chrome138', rollupOptions: { input: 'index.html' } },
  },
});
