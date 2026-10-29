import { afterEach, describe, expect, it, vi } from 'vitest';
import { isWithoutADatabase } from './isWithoutADatabase';

describe('isWithoutADatabase', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('leaves the database alone in development without one, and says so', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('DATABASE_URL', '');
    const writing = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    expect(isWithoutADatabase()).toBe(true);
    expect(writing).toHaveBeenCalledWith(expect.stringContaining('DATABASE_URL is not set'));
  });

  it('uses the database where there is one', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('DATABASE_URL', 'postgres://metrics@localhost/metrics');

    expect(isWithoutADatabase()).toBe(false);
  });

  it('still needs a database in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DATABASE_URL', '');

    expect(isWithoutADatabase()).toBe(false);
  });
});
