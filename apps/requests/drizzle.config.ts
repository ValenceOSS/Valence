import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'drizzle-kit';

/**
 * Reads the same environment file the service is started with, resolved from this file so it is
 * found from the repository root and from here alike.
 */
const loadRootEnvironment = (): void => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../.env');

  if (existsSync(root)) {
    process.loadEnvFile(root);
  }
};

loadRootEnvironment();

export default defineConfig({
  schema: './src/db/Schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['valence_requests'],
  migrations: { schema: 'valence_requests', table: '__migrations' },
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://valence:valence@localhost:5432/valence',
  },
});
