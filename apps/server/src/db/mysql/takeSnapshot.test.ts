import { describe, expect, it, vi } from 'vitest';
import { takeSnapshot } from './takeSnapshot';

const ARGS = [
  '--host=db',
  '--port=3306',
  '--user=valence',
  '--single-transaction',
  '--routines',
  '--triggers',
  '--hex-blob',
  '--add-drop-database',
];

describe('takeSnapshot', () => {
  it('dumps a MariaDB database with mariadb-dump, dropped and created afresh on restore', async () => {
    const run = vi.fn(() => Promise.resolve('ran' as const));
    const makeFolder = vi.fn(() => Promise.resolve(undefined));
    const outcome = await takeSnapshot({
      databaseUrl: 'mariadb://valence:secret@db:3306/valence',
      folder: '/backups',
      name: 'one.sql.gz',
      run,
      flavourOf: () => Promise.resolve('mariadb'),
      makeFolder,
    });

    expect(outcome).toBe('taken');
    expect(makeFolder).toHaveBeenCalledWith('/backups');
    expect(run).toHaveBeenCalledWith({
      command: 'mariadb-dump',
      args: [...ARGS, '--databases', 'valence'],
      env: { MYSQL_PWD: 'secret' },
      file: '/backups/one.sql.gz',
    });
  });

  it('dumps a MySQL database with mysqldump, which leaves generated columns out', async () => {
    const run = vi.fn(() => Promise.resolve('ran' as const));

    await takeSnapshot({
      databaseUrl: 'mysql://valence:secret@db:3306/valence',
      folder: '/backups',
      name: 'one.sql.gz',
      run,
      flavourOf: () => Promise.resolve('mysql'),
      makeFolder: () => Promise.resolve(undefined),
    });

    expect(run).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'mysqldump',
        args: [...ARGS, '--set-gtid-purged=OFF', '--databases', 'valence'],
      }),
    );
  });

  it('says so where the dump tool is not installed', async () => {
    const outcome = await takeSnapshot({
      databaseUrl: 'mysql://db/valence',
      folder: '/backups',
      name: 'one.sql.gz',
      run: () => Promise.resolve('missing'),
      flavourOf: () => Promise.resolve('mysql'),
      makeFolder: () => Promise.resolve(undefined),
    });

    expect(outcome).toBe('missing');
  });
});
