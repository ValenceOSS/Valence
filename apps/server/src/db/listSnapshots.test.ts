import { describe, expect, it } from 'vitest';
import { listSnapshots } from '@ValenceServer/db/listSnapshots';

const OLD = 'valence-2026-01-01T00-00-00-000Z-before-0001_a.dump';
const NEW = 'valence-2026-02-01T00-00-00-000Z-before-0002_b.dump';

describe('listSnapshots', () => {
  it('lists snapshots newest first and skips everything else', async () => {
    const names = await listSnapshots({
      folder: '/backups',
      readFolder: () => Promise.resolve([OLD, 'notes.txt', NEW]),
    });

    expect(names).toEqual([NEW, OLD]);
  });

  it('holds none where the folder does not exist', async () => {
    const names = await listSnapshots({
      folder: '/nowhere',
      readFolder: () => Promise.reject(new Error('ENOENT')),
    });

    expect(names).toEqual([]);
  });
});
