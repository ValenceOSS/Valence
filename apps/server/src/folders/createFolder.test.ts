import { describe, expect, it, vi } from 'vitest';
import { createFolder } from '@ValenceServer/folders/createFolder';
import type { DirectoryMade, FolderDisk } from '@ValenceServer/folders/FolderDisk';

const diskThatAnswers = (answer: DirectoryMade) => {
  const makeDirectory = vi.fn<(path: string) => Promise<DirectoryMade>>(() =>
    Promise.resolve(answer),
  );

  const disk: FolderDisk = {
    readDirectory: () => Promise.resolve({ kind: 'missing' }),
    isDirectory: () => Promise.resolve(false),
    roots: () => Promise.resolve([]),
    makeDirectory,
  };

  return { disk, makeDirectory };
};

describe('createFolder', () => {
  it('makes a folder inside the one it was asked to, and says where it is', async () => {
    const { disk, makeDirectory } = diskThatAnswers('made');

    await expect(createFolder(disk, '/media', 'anime')).resolves.toEqual({
      kind: 'created',
      folder: { name: 'anime', path: '/media/anime' },
    });
    expect(makeDirectory).toHaveBeenCalledWith('/media/anime');
  });

  it('trims the name, since a space at either end is a mistake', async () => {
    const { disk, makeDirectory } = diskThatAnswers('made');

    await createFolder(disk, '/media', '  anime  ');

    expect(makeDirectory).toHaveBeenCalledWith('/media/anime');
  });

  it('refuses a parent that does not start from the root', async () => {
    const { disk, makeDirectory } = diskThatAnswers('made');

    await expect(createFolder(disk, 'media', 'anime')).resolves.toEqual({ kind: 'relative' });
    expect(makeDirectory).not.toHaveBeenCalled();
  });

  it.each(['', '   ', '.', '..', '../etc', 'a/b', 'a\\b', 'a\0b', 'x'.repeat(256)])(
    'refuses %j as a name, so nothing typed can climb out of the folder',
    async (name) => {
      const { disk, makeDirectory } = diskThatAnswers('made');

      await expect(createFolder(disk, '/media', name)).resolves.toEqual({ kind: 'badName' });
      expect(makeDirectory).not.toHaveBeenCalled();
    },
  );

  it('resolves the parent, so a path walking up is read for where it ends', async () => {
    const { disk, makeDirectory } = diskThatAnswers('made');

    await createFolder(disk, '/media/films/..', 'anime');

    expect(makeDirectory).toHaveBeenCalledWith('/media/anime');
  });

  it.each(['exists', 'missing', 'readOnly', 'denied'] as const)(
    'reports what the disk said when it says %s',
    async (answer) => {
      const { disk } = diskThatAnswers(answer);

      await expect(createFolder(disk, '/media', 'anime')).resolves.toEqual({ kind: answer });
    },
  );
});
