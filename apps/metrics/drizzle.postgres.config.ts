import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/Schema.ts',
  out: './drizzle/postgres',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://valence:valence@localhost:5432/valence_metrics',
  },
});
