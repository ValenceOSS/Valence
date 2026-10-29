import { describe, expect, it, vi } from 'vitest';
import { readDatabaseKind } from './readDatabaseKind';

const readMysqlFlavour = vi.hoisted(() => vi.fn(() => Promise.resolve('mariadb')));

vi.mock('@ValenceServer/db/mysql/server/readMysqlFlavour', () => ({ readMysqlFlavour }));

describe('readDatabaseKind', () => {
  it('asks the server whether it is MySQL or MariaDB', async () => {
    await expect(readDatabaseKind('mariadb://valence@localhost/valence')).resolves.toBe('mariadb');
    expect(readMysqlFlavour).toHaveBeenCalledWith(
      'mariadb://valence@localhost/valence',
      expect.anything(),
    );
  });
});
