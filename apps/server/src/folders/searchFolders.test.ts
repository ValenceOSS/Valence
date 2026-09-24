import { describe, expect, it } from 'vitest';
import { searchFolders } from './searchFolders';
import type { DirectoryRead, FolderDisk, FolderEntry } from '@ValenceServer/folders/FolderDisk';

const folder = (name: string): FolderEntry => ({ name, isDirectory: true, isSymbolicLink: false });

const link = (name: string): FolderEntry => ({ name, isDirectory: false, isSymbolicLink: true });

const holding = (...entries: FolderEntry[]): DirectoryRead => ({ kind: 'read', entries });

const diskWith = (
  tree: Record<string, DirectoryRead>,
  roots: string[] = ['/', '/mnt'],
): FolderDisk & { read: string[] } => {
  const read: string[] = [];

  return {
    read,
    readDirectory: (path) => {
      read.push(path);

      return Promise.resolve(tree[path] ?? { kind: 'missing' });
    },
    isDirectory: () => Promise.resolve(true),
    roots: () => Promise.resolve(roots),
    makeDirectory: () => Promise.resolve('denied'),
  };
};

const namesOf = (answer: Awaited<ReturnType<typeof searchFolders>>): string[] =>
  answer.kind === 'found' ? answer.search.folders.map((one) => one.path) : [];

describe('searchFolders', () => {
  it('finds folders below the one it is in whose names hold the words, nearest first', async () => {
    const disk = diskWith({
      '/mnt/storage': holding(folder('media'), folder('Backups')),
      '/mnt/storage/media': holding(folder('Anime'), folder('Films'), folder('Music')),
      '/mnt/storage/media/Anime': holding(folder('Frieren')),
      '/mnt/storage/Backups': holding(folder('old media')),
    });

    expect(namesOf(await searchFolders(disk, 'MEDIA', '/mnt/storage'))).toEqual([
      '/mnt/storage/media',
      '/mnt/storage/Backups/old media',
    ]);
  });

  it('looks below the places to start from but never the whole disk, asked from nowhere', async () => {
    const disk = diskWith({
      '/': holding(folder('media')),
      '/mnt': holding(folder('media')),
    });

    expect(namesOf(await searchFolders(disk, 'media'))).toEqual(['/mnt/media']);
    expect(disk.read).not.toContain('/');
  });

  it('never looks in or finds a hidden folder, and follows no link', async () => {
    const disk = diskWith({
      '/mnt': holding(folder('.films'), link('films-elsewhere'), folder('Films')),
      '/mnt/.films': holding(folder('Films')),
    });

    expect(namesOf(await searchFolders(disk, 'films', '/mnt'))).toEqual(['/mnt/Films']);
    expect(disk.read).not.toContain('/mnt/.films');
  });

  it('goes no deeper than a few levels', async () => {
    const disk = diskWith({
      '/a': holding(folder('b')),
      '/a/b': holding(folder('c')),
      '/a/b/c': holding(folder('d')),
      '/a/b/c/d': holding(folder('match')),
      '/a/b/c/d/match': holding(folder('match')),
    });

    expect(namesOf(await searchFolders(disk, 'match', '/a'))).toEqual(['/a/b/c/d/match']);
  });

  it('passes over a folder it may not read rather than giving up', async () => {
    const disk = diskWith({
      '/mnt': holding(folder('locked'), folder('open')),
      '/mnt/locked': { kind: 'unreadable' },
      '/mnt/open': holding(folder('Films')),
    });

    expect(namesOf(await searchFolders(disk, 'films', '/mnt'))).toEqual(['/mnt/open/Films']);
  });

  it('says so where it stopped before looking everywhere', async () => {
    const many = Array.from({ length: 300 }, (_, at) => folder(`Show ${at.toString()}`));
    const answer = await searchFolders(diskWith({ '/mnt': holding(...many) }), 'show', '/mnt');

    expect(answer.kind === 'found' ? answer.search.folders : []).toHaveLength(200);
    expect(answer.kind === 'found' && answer.search.isTruncated).toBe(true);
  });

  it('refuses a folder that does not start from the root', async () => {
    await expect(searchFolders(diskWith({}), 'films', 'media')).resolves.toEqual({
      kind: 'relative',
    });
  });
});
