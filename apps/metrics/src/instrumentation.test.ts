import { afterEach, describe, expect, it, vi } from 'vitest';
import { migrateDatabase } from '@ValenceMetrics/db/migrateDatabase';
import { register } from './instrumentation';

vi.mock('@ValenceMetrics/db/migrateDatabase', () => ({
  migrateDatabase: vi.fn(() => Promise.resolve(undefined)),
}));

describe('register', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(migrateDatabase).mockClear();
  });

  it('brings the database up to date as the Node server starts', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');

    await register();

    expect(migrateDatabase).toHaveBeenCalledOnce();
  });

  it('leaves the database alone anywhere else', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');

    await register();

    expect(migrateDatabase).not.toHaveBeenCalled();
  });
});
