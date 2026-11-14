import { describe, expect, it } from 'vitest';
import { aLibraryAt } from '@ValenceServer/files/aLibraryAt';
import { withoutHostFolders } from './withoutHostFolders';

describe('withoutHostFolders', () => {
  it('drops where a library is on the machine, and keeps what a client shows of it', () => {
    const shown = withoutHostFolders({
      ...aLibraryAt('/mnt/nas/films'),
      requestPath: '/mnt/nas/requested',
      requestProfileId: '6c2b6b0e-2d6f-4c63-9d0e-3b1f4a8a9a10',
      filesAtOnce: 4,
      writesNfo: true,
    });

    expect(shown).toMatchObject({
      name: 'Films',
      kind: 'movies',
      path: '/',
      requestPath: null,
      requestProfileId: null,
      filesAtOnce: null,
    });
    expect('writesNfo' in shown).toBe(false);
  });
});
