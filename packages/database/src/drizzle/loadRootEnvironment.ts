import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Reads the environment file at the repository root, the one the services are started with, so a
 * drizzle-kit command reaches the database they use rather than falling back to one that is not
 * there and reporting nothing to migrate.
 *
 * @param file - The environment file to read, which is the root's unless a test says otherwise.
 */
const loadRootEnvironment = (
  file = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '.env'),
): void => {
  if (existsSync(file)) {
    process.loadEnvFile(file);
  }
};

export { loadRootEnvironment };
