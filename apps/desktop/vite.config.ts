import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const DEV_PORT = 5174;

const EDGES_WEBVIEW = 'chrome111';

const WEBKITS_WEBVIEW = 'safari16.4';

export default defineConfig({
  root: '.',
  base: '/',
  resolve: { tsconfigPaths: true },
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: DEV_PORT,
    strictPort: true,
    host: '127.0.0.1',
    hmr: { protocol: 'ws', host: '127.0.0.1', port: DEV_PORT },
  },
  build: {
    target: process.env['TAURI_ENV_PLATFORM'] === 'windows' ? EDGES_WEBVIEW : WEBKITS_WEBVIEW,
    outDir: 'dist',
    emptyOutDir: true,
    rolldownOptions: { input: { index: 'index.html', update: 'update.html' } },
  },
});
