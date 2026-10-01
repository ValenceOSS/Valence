import { defineConfig } from 'drizzle-kit';
import { loadRootEnvironment } from '@ValenceTools/drizzle/loadRootEnvironment';

loadRootEnvironment();

export default defineConfig({
  schema: './src/db/mysql/Schema.ts',
  out: './drizzle/mysql',
  dialect: 'mysql',
  tablesFilter: ['requests_*'],
  migrations: { table: '__requests_migrations' },
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'mysql://valence:valence@localhost:3306/valence',
  },
});
