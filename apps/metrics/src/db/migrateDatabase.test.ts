import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { migrateDatabase } from './migrateDatabase';

vi.mock('drizzle-orm/postgres-js/migrator', () => ({
  migrate: vi.fn(() => Promise.resolve(undefined)),
}));

vi.mock('./openDatabase', () => ({ openDatabase: vi.fn(() => ({ isTheDatabase: true })) }));

describe('migrateDatabase', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(migrate).mockClear();
  });

  it('applies the migrations shipped beside the app', async () => {
    vi.stubEnv('METRICS_MIGRATIONS', undefined);

    await migrateDatabase();

    expect(vi.mocked(migrate).mock.calls[0]?.[1]).toStrictEqual({
      migrationsFolder: join(process.cwd(), 'drizzle', 'postgres'),
    });
  });

  it('applies them from wherever it is told they are', async () => {
    vi.stubEnv('METRICS_MIGRATIONS', '/app/migrations');

    await migrateDatabase();

    expect(vi.mocked(migrate).mock.calls[0]?.[1]).toStrictEqual({
      migrationsFolder: '/app/migrations',
    });
  });

  it('migrates the site’s own database', async () => {
    await migrateDatabase();

    expect(vi.mocked(migrate).mock.calls[0]?.[0]).toStrictEqual({ isTheDatabase: true });
  });
});
