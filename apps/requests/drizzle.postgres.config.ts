import { defineConfig } from 'drizzle-kit';
import { loadRootEnvironment } from '@ValenceTools/drizzle/loadRootEnvironment';

loadRootEnvironment();

export default defineConfig({
  schema: './src/db/postgres/Schema.ts',
  out: './drizzle/postgres',
  dialect: 'postgresql',
  schemaFilter: ['valence_requests'],
  migrations: { schema: 'valence_requests', table: '__migrations' },
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://valence:valence@localhost:5432/valence',
  },
});
