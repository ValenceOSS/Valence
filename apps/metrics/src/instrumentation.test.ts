import { afterEach, describe, expect, it, vi } from 'vitest';
import { migrateDatabase } from '@ValenceMetrics/db/migrateDatabase';
import { forgetQuietInstalls } from '@ValenceMetrics/reports/forgetQuietInstalls';
import { register } from './instrumentation';

vi.mock('@ValenceMetrics/db/migrateDatabase', () => ({
  migrateDatabase: vi.fn(() => Promise.resolve(undefined)),
}));

vi.mock('@ValenceMetrics/db/openDatabase', () => ({ openDatabase: vi.fn() }));

vi.mock('@ValenceMetrics/db/isWithoutADatabase', () => ({
  isWithoutADatabase: vi.fn(() => process.env.DATABASE_URL === ''),
}));

vi.mock('@ValenceMetrics/reports/forgetQuietInstalls', () => ({
  forgetQuietInstalls: vi.fn(() => Promise.resolve(0)),
}));

describe('register', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(migrateDatabase).mockClear();
    vi.mocked(forgetQuietInstalls).mockClear();
  });

  it('brings the database up to date as the Node server starts', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('DATABASE_URL', 'postgres://metrics@localhost/metrics');

    await register();

    expect(migrateDatabase).toHaveBeenCalledOnce();
  });

  it('forgets installs quiet for a year as soon as the database is ready', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('DATABASE_URL', 'postgres://metrics@localhost/metrics');

    await register();

    expect(forgetQuietInstalls).toHaveBeenCalledOnce();
  });

  it('leaves the database alone anywhere else', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');

    await register();

    expect(migrateDatabase).not.toHaveBeenCalled();
  });

  it('starts without a database in development', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('DATABASE_URL', '');

    await register();

    expect(migrateDatabase).not.toHaveBeenCalled();
    expect(forgetQuietInstalls).not.toHaveBeenCalled();
  });
});
