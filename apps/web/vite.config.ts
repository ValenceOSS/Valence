import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { Plugin } from 'vite';

/**
 * Reads a development certificate where one has been put beside the config, so the dev server can be
 * served over HTTPS — several of the browser features Valence uses, passkeys and casting among them,
 * refuse to work over plain HTTP.
 *
 * @param name - The certificate file to read.
 * @returns Its contents, or null where it has not been made.
 */
const certificate = (name: string): Buffer | null => {
  const path = fileURLToPath(new URL(`./certificates/${name}`, import.meta.url));

  return existsSync(path) ? readFileSync(path) : null;
};

const WORKER_SOURCE = 'src/notifications/pushWorker.ts';

const WORKER_PATH = '/push-worker.js';

/**
 * Compiles the push service worker to its own file.
 *
 * Its own bundle rather than an entry of the app's, because Rollup names the
 * app's outputs with content hashes and a service worker registered at a
 * hashed path would be a different worker on every deploy — leaving the old
 * one installed and in charge.
 */
const pushWorker = (): Plugin => ({
  name: 'valence-push-worker',

  configureServer: (server) => {
    server.middlewares.use((request, response, next) => {
      if (request.url !== WORKER_PATH) {
        next();

        return;
      }

      void build({
        configFile: false,
        logLevel: 'error',
        resolve: { tsconfigPaths: true },
        build: {
          write: false,
          lib: { entry: WORKER_SOURCE, formats: ['es'], fileName: 'push-worker' },
        },
      }).then((made) => {
        const output = Array.isArray(made) ? made[0]?.output : null;
        const chunk = output?.[0];

        response.setHeader('content-type', 'text/javascript');
        response.end(chunk !== undefined && 'code' in chunk ? chunk.code : '');
      });
    });
  },

  closeBundle: async () => {
    await build({
      configFile: false,
      logLevel: 'error',
      resolve: { tsconfigPaths: true },
      build: {
        emptyOutDir: false,
        outDir: 'dist',
        lib: { entry: WORKER_SOURCE, formats: ['es'], fileName: () => 'push-worker.js' },
      },
    });
  },
});

const PATHS = fileURLToPath(new URL('../../tsconfig.paths.json', import.meta.url));

/**
 * Starts the dev server again, in place, whenever the path aliases change.
 *
 * The aliases are read once, as the server starts, so one added for a new component resolved to
 * nothing — and went on resolving to nothing, the failure cached — until somebody restarted the
 * server by hand. Restarting in place, as pressing `r` in its terminal does, reads them again and
 * forgets what failed, and the page reloads with them.
 */
const aliasesAsTheyChange = (): Plugin => ({
  name: 'valence-aliases-as-they-change',

  configureServer: (server) => {
    server.watcher.add(PATHS);
    server.watcher.on('change', (file) => {
      if (file === PATHS) {
        server.config.logger.info('path aliases changed; starting again', { timestamp: true });
        void server.restart();
      }
    });
  },
});

const cert = certificate('local.pem');
const key = certificate('local-key.pem');

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [react(), tailwindcss(), pushWorker(), aliasesAsTheyChange()],
  server: {
    port: 5173,
    host: true,
    cors: false,
    ...(cert === null || key === null ? {} : { https: { cert, key } }),
    proxy: {
      '/api': { target: 'http://localhost:8420', ws: true },
    },
  },
});
