import { describe, expect, it, vi } from 'vitest';
import { restoreSnapshot } from '@ValenceServer/db/restoreSnapshot';

describe('restoreSnapshot', () => {
  it('replaces the database, connecting through the postgres one', async () => {
    const run = vi.fn(() => Promise.resolve('ran' as const));

    await restoreSnapshot({
      databaseUrl: 'postgres://valence:secret@db:5432/valence',
      folder: '/backups',
      name: 'one.dump',
      run,
    });

    expect(run).toHaveBeenCalledWith('pg_restore', [
      '--clean',
      '--create',
      '--if-exists',
      '--no-owner',
      '--dbname=postgres://valence:secret@db:5432/postgres',
      '/backups/one.dump',
    ]);
  });

  it('fails where pg_restore is not installed', async () => {
    await expect(
      restoreSnapshot({
        databaseUrl: 'postgres://db/valence',
        folder: '/backups',
        name: 'one.dump',
        run: () => Promise.resolve('missing'),
      }),
    ).rejects.toThrow('pg_restore is not installed');
  });
});
