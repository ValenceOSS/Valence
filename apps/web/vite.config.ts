import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build, defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { tsImport } from 'tsx/esm/api';
import { z } from 'zod';
import type { Plugin, ProxyOptions } from 'vite';

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

const SERVER = process.env.VALENCE_DEV_SERVER ?? 'http://localhost:8420';

/**
 * Sends the dev server's requests on to a Valence server, which is the one running on this machine
 * unless VALENCE_DEV_SERVER names another, such as a live one. A request handed on to another server
 * says it came from that server, as a page served there would, so its sign-in accepts it.
 *
 * @param isSocket - Whether WebSockets are handed on too.
 * @returns How to hand the requests on.
 */
const toTheServer = (isSocket: boolean): ProxyOptions => ({
  target: SERVER,
  ws: isSocket,
  changeOrigin: true,
  configure: (proxy) => {
    proxy.on('proxyReq', (request) => {
      if (request.getHeader('origin') !== undefined) {
        request.setHeader('origin', new URL(SERVER).origin);
      }
    });
    proxy.on('proxyReqWs', (request) => {
      request.setHeader('origin', new URL(SERVER).origin);
    });
  },
});

const cert = certificate('local.pem');
const key = certificate('local-key.pem');

const compiler = reactCompilerPreset();

const memoised = {
  ...compiler,
  rolldown: {
    ...compiler.rolldown,
    filter: {
      ...compiler.rolldown?.filter,
      id: { exclude: [/\/node_modules\//, /\/packages\/i18n\//, /\.test\.tsx?$/] },
    },
  },
};

const WordsByLanguageToolSchema = z.object({
  wordsByLanguage: z.custom<() => Plugin>((value) => typeof value === 'function'),
});

const { wordsByLanguage } = WordsByLanguageToolSchema.parse(
  await tsImport('@ValenceI18n/wordsByLanguage', import.meta.url),
);

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    wordsByLanguage(),
    react(),
    babel({ presets: [memoised] }),
    tailwindcss(),
    pushWorker(),
    aliasesAsTheyChange(),
  ],
  worker: { format: 'es' },
  server: {
    port: 5173,
    host: true,
    cors: false,
    ...(cert === null || key === null ? {} : { https: { cert, key } }),
    proxy: {
      '/api': toTheServer(true),
      '/arr': toTheServer(false),
    },
  },
});
