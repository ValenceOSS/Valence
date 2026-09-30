import { describe, expect, it, vi } from 'vitest';
import { restoreSnapshot } from './restoreSnapshot';

describe('restoreSnapshot', () => {
  it.each([
    ['mysql', 'mysql'],
    ['mariadb', 'mariadb'],
  ] as const)(
    'feeds the snapshot to a %s server through its own client',
    async (flavour, command) => {
      const run = vi.fn(() => Promise.resolve('ran' as const));

      await restoreSnapshot({
        databaseUrl: 'mysql://valence:secret@db:3306/valence',
        folder: '/backups',
        name: 'one.sql.gz',
        run,
        flavourOf: () => Promise.resolve(flavour),
      });

      expect(run).toHaveBeenCalledWith({
        command,
        args: ['--host=db', '--port=3306', '--user=valence'],
        env: { MYSQL_PWD: 'secret' },
        file: '/backups/one.sql.gz',
      });
    },
  );

  it('fails where the client is not installed', async () => {
    await expect(
      restoreSnapshot({
        databaseUrl: 'mysql://db/valence',
        folder: '/backups',
        name: 'one.sql.gz',
        run: () => Promise.resolve('missing'),
        flavourOf: () => Promise.resolve('mariadb'),
      }),
    ).rejects.toThrow('mariadb is not installed');
  });
});
