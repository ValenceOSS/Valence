import { fileURLToPath } from 'node:url';
import { defaultServerConditions, loadConfigFromFile } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';
import type { TestProjectInlineConfiguration } from 'vitest/config';
import { findEngineTests } from './vitest/findEngineTests';

const MYSQL_CONDITIONS = ['mysql', ...defaultServerConditions];

const PACKAGES = ['packages/database', 'apps/server', 'apps/requests'];

const REPOSITORY = fileURLToPath(new URL('..', import.meta.url));

/**
 * Builds the project that runs one package's engine tests under the mysql condition, from the
 * package's own config with its test list replaced rather than merged into, since `extends` would
 * keep every test the package includes and its exclusion of the mysql folder.
 *
 * @param name - The package, from the repository root.
 * @returns The project.
 */
const engineProject = async (name: string): Promise<TestProjectInlineConfiguration> => {
  const root = `${REPOSITORY}${name}`;
  const loaded = await loadConfigFromFile(
    { command: 'serve', mode: 'test' },
    `${root}/vitest.config.ts`,
    root,
  );

  return {
    ...loaded?.config,
    root,
    resolve: { ...loaded?.config.resolve, conditions: MYSQL_CONDITIONS },
    ssr: { resolve: { conditions: MYSQL_CONDITIONS } },
    test: {
      ...loaded?.config.test,
      name,
      include: findEngineTests(root).filter((path) => !path.includes('/postgres/')),
      exclude: configDefaults.exclude,
    },
  };
};

export default defineConfig({
  test: {
    fileParallelism: false,
    projects: await Promise.all(PACKAGES.map(engineProject)),
  },
});
