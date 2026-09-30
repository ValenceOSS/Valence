import { fileURLToPath } from 'node:url';
import { defaultServerConditions } from 'vite';
import { defineConfig } from 'vitest/config';
import { findEngineTests } from './vitest/findEngineTests';

const MYSQL_CONDITIONS = ['mysql', ...defaultServerConditions];

const PACKAGES = ['packages/database', 'apps/server', 'apps/requests'];

const REPOSITORY = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  test: {
    fileParallelism: false,
    projects: PACKAGES.map((name) => {
      const root = `${REPOSITORY}${name}`;

      return {
        extends: `${root}/vitest.config.ts`,
        root,
        resolve: { conditions: MYSQL_CONDITIONS },
        ssr: { resolve: { conditions: MYSQL_CONDITIONS } },
        test: {
          name,
          include: findEngineTests(root).filter((path) => !path.includes('/postgres/')),
        },
      };
    }),
  },
});
