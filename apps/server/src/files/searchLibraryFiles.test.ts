import { describe, expect, it } from 'vitest';
import { aLibraryAt } from './aLibraryAt';
import { searchLibraryFiles } from './searchLibraryFiles';
import type { DirectoryRead, FolderDisk, FolderEntry } from '@ValenceServer/folders/FolderDisk';

const folder = (name: string): FolderEntry => ({ name, isDirectory: true, isSymbolicLink: false });

const file = (name: string): FolderEntry => ({ name, isDirectory: false, isSymbolicLink: false });

const TREE: Record<string, DirectoryRead> = {
  '/media/films': { kind: 'read', entries: [folder('Arrival (2016)'), file('Arrival.mkv')] },
  '/media/anime': { kind: 'read', entries: [file('Arrival of the Hero.mkv')] },
};

const DISK: FolderDisk = {
  readDirectory: (path) => Promise.resolve(TREE[path] ?? { kind: 'missing' }),
  isDirectory: () => Promise.resolve(true),
  roots: () => Promise.resolve(['/']),
  makeDirectory: () => Promise.resolve('denied'),
};

const LIBRARIES = [aLibraryAt('/media/films', 'films'), aLibraryAt('/media/anime', 'anime')];

describe('searchLibraryFiles', () => {
  it('finds files and folders below every library, saying which files Valence knows', async () => {
    const answer = await searchLibraryFiles(DISK, LIBRARIES, 'arrival', undefined, (paths) =>
      Promise.resolve(
        paths.includes('/media/films/Arrival.mkv') ? { '/media/films/Arrival.mkv': 'm1' } : {},
      ),
    );

    expect(answer.kind === 'found' ? answer.search.entries : []).toEqual([
      expect.objectContaining({
        path: '/media/films/Arrival (2016)',
        isFolder: true,
        mediaId: null,
      }),
      expect.objectContaining({ path: '/media/films/Arrival.mkv', isFolder: false, mediaId: 'm1' }),
      expect.objectContaining({ path: '/media/anime/Arrival of the Hero.mkv', mediaId: null }),
    ]);
  });

  it('looks only below the folder it is in, which must be inside a library', async () => {
    const answer = await searchLibraryFiles(DISK, LIBRARIES, 'arrival', '/media/anime', () =>
      Promise.resolve({}),
    );

    expect(answer.kind === 'found' ? answer.search.entries.map((one) => one.name) : []).toEqual([
      'Arrival of the Hero.mkv',
    ]);
    await expect(
      searchLibraryFiles(DISK, LIBRARIES, 'arrival', '/etc', () => Promise.resolve({})),
    ).resolves.toEqual({ kind: 'outside' });
  });
});
