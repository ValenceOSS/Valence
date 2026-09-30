import { describe, expect, it, vi } from 'vitest';
import { takeSnapshot } from '@ValenceServer/db/takeSnapshot';

describe('takeSnapshot', () => {
  it('dumps the whole database, created afresh on restore, into the folder', async () => {
    const run = vi.fn(() => Promise.resolve('ran' as const));
    const makeFolder = vi.fn(() => Promise.resolve(undefined));
    const outcome = await takeSnapshot({
      databaseUrl: 'postgres://db/valence',
      folder: '/backups',
      name: 'one.dump',
      run,
      makeFolder,
    });

    expect(outcome).toBe('taken');
    expect(makeFolder).toHaveBeenCalledWith('/backups');
    expect(run).toHaveBeenCalledWith('pg_dump', [
      '--format=custom',
      '--create',
      '--file=/backups/one.dump',
      '--dbname=postgres://db/valence',
    ]);
  });

  it('says so where pg_dump is not installed', async () => {
    const outcome = await takeSnapshot({
      databaseUrl: 'postgres://db/valence',
      folder: '/backups',
      name: 'one.dump',
      run: () => Promise.resolve('missing'),
      makeFolder: () => Promise.resolve(undefined),
    });

    expect(outcome).toBe('missing');
  });
});
