import { describe, expect, it } from 'vitest';
import { findByName } from './findByName';
import type { DirectoryRead, FolderDisk, FolderEntry } from '@ValenceServer/folders/FolderDisk';

const folder = (name: string): FolderEntry => ({ name, isDirectory: true, isSymbolicLink: false });

const file = (name: string): FolderEntry => ({ name, isDirectory: false, isSymbolicLink: false });

const diskWith = (tree: Record<string, DirectoryRead>): FolderDisk => ({
  readDirectory: (path) => Promise.resolve(tree[path] ?? { kind: 'missing' }),
  isDirectory: () => Promise.resolve(true),
  roots: () => Promise.resolve([]),
  makeDirectory: () => Promise.resolve('denied'),
});

const DISK = diskWith({
  '/media': { kind: 'read', entries: [file('Arrival.mkv'), folder('Arrival (2016)')] },
  '/media/Arrival (2016)': { kind: 'read', entries: [file('Arrival (2016).mkv')] },
});

describe('findByName', () => {
  it('finds files as well as folders where asked, folders first at each level', async () => {
    const { found } = await findByName(DISK, 'arrival', ['/media'], true);

    expect(found).toEqual([
      { name: 'Arrival (2016)', path: '/media/Arrival (2016)', isFolder: true },
      { name: 'Arrival.mkv', path: '/media/Arrival.mkv', isFolder: false },
      {
        name: 'Arrival (2016).mkv',
        path: '/media/Arrival (2016)/Arrival (2016).mkv',
        isFolder: false,
      },
    ]);
  });

  it('finds only folders where files are not wanted', async () => {
    const { found } = await findByName(DISK, 'arrival', ['/media'], false);

    expect(found.map((one) => one.name)).toEqual(['Arrival (2016)']);
  });
});
