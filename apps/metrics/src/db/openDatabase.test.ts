import { afterEach, describe, expect, it, vi } from 'vitest';

describe('openDatabase', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('refuses where there is no database named', async () => {
    vi.stubEnv('DATABASE_URL', '');

    const { openDatabase } = await import('./openDatabase');

    expect(() => openDatabase()).toThrow('DATABASE_URL is not set');
  });

  it('connects once and hands back the same connection after', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://nobody:nobody@127.0.0.1:1/nothing');

    const { openDatabase } = await import('./openDatabase');

    expect(openDatabase()).toBe(openDatabase());
  });
});
