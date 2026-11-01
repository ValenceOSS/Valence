import { describe, expect, it } from 'vitest';
import { readLibraryLocks } from './readLibraryLocks';
import type { ServerSettings } from '@ValenceServer/settings/ServerSettings';

const keeping = (libraryLocks: ServerSettings['libraryLocks']) => ({
  read: () => Promise.resolve({ libraryLocks }),
});

describe('readLibraryLocks', () => {
  it('reads the locks kept, library by library', async () => {
    const locks = { 'library-1': { hash: 'h', relockMinutes: 30 } };

    expect(await readLibraryLocks(keeping(locks))).toEqual(locks);
  });

  it('reads no locks where none are kept', async () => {
    expect(await readLibraryLocks(keeping({}))).toEqual({});
  });
});
