import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { commitBuiltFrom } from '@valence/core/src/functions/commitBuiltFrom.ts';

const NOT_BUNDLED = [/^electron$/, /^conf$/, /^better-auth(\/.*)?$/, /^@better-auth\/.*/, /^zod$/];

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
