import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fileBook } from '@ValenceRequests/mediaRequests/fileBook';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'valence-book-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const DUNE = [{ id: 'dune', title: 'Dune' }];

const aDownload = async (names: readonly string[]): Promise<string> => {
  const folder = join(root, 'downloads', 'Frank Herbert - Dune (Unabridged)');

  for (const name of names) {
    await mkdir(join(folder, name, '..'), { recursive: true });
    await writeFile(join(folder, name), name);
  }

  return folder;
};

const filesUnder = async (folder: string): Promise<string[]> =>
  (await readdir(folder, { recursive: true, withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name).slice(folder.length + 1))
    .toSorted();

const aRequest = () => ({
  libraryPath: join(root, 'Books'),
  title: 'Dune',
  artistName: 'Frank Herbert',
});

describe('fileBook', () => {
  it('files an audiobook into its author’s folder, with its cover, leaving its cue and notes', async () => {
    const download = await aDownload(['Dune.m4b', 'cover.jpg', 'Dune.cue', 'Dune.sfv', 'Dune.nfo']);

    const { filed, missing } = await fileBook(aRequest(), DUNE, download, true);

    expect(missing).toEqual([]);
    expect(filed.get('dune')).toBe(join(root, 'Books', 'Frank Herbert', 'Dune'));
    expect(await filesUnder(join(root, 'Books'))).toEqual([
      'Frank Herbert/Dune/Dune.m4b',
      'Frank Herbert/Dune/cover.jpg',
    ]);
  });

  it('numbers an audiobook’s tracks in order across its discs, in one folder', async () => {
    const download = await aDownload([
      'CD2/01 Part Three.mp3',
      'CD1/10 Part Two.mp3',
      'CD1/02 Part One.mp3',
      'folder.jpg',
    ]);

    await fileBook(aRequest(), DUNE, download, false);

    expect(await filesUnder(join(root, 'Books', 'Frank Herbert', 'Dune'))).toEqual([
      '01 - Part One.mp3',
      '02 - Part Two.mp3',
      '03 - Part Three.mp3',
      'cover.jpg',
    ]);
  });

  it('files a book to read and the same book to hear together, as one book', async () => {
    const download = await aDownload(['Dune.epub', 'Audio/Dune.m4b']);

    await fileBook(aRequest(), DUNE, download, true);

    expect(await filesUnder(join(root, 'Books', 'Frank Herbert', 'Dune'))).toEqual([
      'Dune.epub',
      'Dune.m4b',
    ]);
  });

  it('files a book straight into the library where nobody named its author', async () => {
    const download = await aDownload(['dune.epub']);

    const { filed } = await fileBook({ ...aRequest(), artistName: null }, DUNE, download, true);

    expect(filed.get('dune')).toBe(join(root, 'Books', 'Dune'));
    expect(await filesUnder(join(root, 'Books'))).toEqual(['Dune/Dune.epub']);
  });

  it('says nothing could be filed from a download with no book in it', async () => {
    const download = await aDownload(['cover.jpg', 'Dune.cue']);

    expect(await fileBook(aRequest(), DUNE, download, true)).toEqual({
      filed: new Map(),
      missing: ['dune'],
    });
  });
});
