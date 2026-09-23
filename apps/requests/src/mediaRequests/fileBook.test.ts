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

describe('fileBook, given a pack of several books', () => {
  const TAGS: Record<string, { album: string; title: string; author: string }> = {
    'Book 1-Red Rising.m4b': {
      album: 'Red Rising (Unabridged)',
      title: 'Red Rising (Unabridged)',
      author: 'Pierce Brown',
    },
    'Book 2-Red Rising-Golden Son .m4b': {
      album: 'Golden Son (Unabridged)',
      title: 'Golden Son: Book II of the Red Rising Trilogy (Unabridged)',
      author: 'Pierce Brown',
    },
    'Iron Gold (Unabridged).m4b': {
      album: 'Iron Gold (Unabridged)',
      title: 'Iron Gold (Unabridged)',
      author: 'Pierce Brown',
    },
  };

  const readTags = (path: string) => Promise.resolve(TAGS[path.split('/').at(-1) ?? ''] ?? null);

  const aSaga = async (): Promise<string> => {
    const folder = join(root, 'downloads', 'Pierce Brown-Red Rising-[1-5]');

    for (const name of [
      'Pierce Brown-Red Rising-#1-Red Rising/Book 1-Red Rising.m4b',
      'Pierce Brown-Red Rising-#2-Golden Son/Book 2-Red Rising-Golden Son .m4b',
      'Pierce Brown-Red Rising-#4-Iron Gold/Iron Gold (Unabridged).m4b',
      'Pierce Brown-Red Rising-#4-Iron Gold/Iron Gold (Unabridged).jpg',
      'Pierce Brown-Red Rising-#4-Iron Gold/Iron Gold (Unabridged).cue',
    ]) {
      await mkdir(join(folder, name, '..'), { recursive: true });
      await writeFile(join(folder, name), name);
    }

    return folder;
  };

  it('files each book as its own, named by its own tags, each with only its own cover', async () => {
    const saga = await aSaga();

    const { filed } = await fileBook(
      { libraryPath: join(root, 'Books'), title: 'Red Rising Saga Books 1-5', artistName: null },
      [{ id: 'book', title: 'Red Rising Saga Books 1-5' }],
      saga,
      true,
      { readTags },
    );

    expect(filed.get('book')).toBe(join(root, 'Books', 'Pierce Brown'));
    expect(await filesUnder(join(root, 'Books'))).toEqual([
      'Pierce Brown/Golden Son/Golden Son.m4b',
      'Pierce Brown/Iron Gold/Iron Gold.m4b',
      'Pierce Brown/Iron Gold/cover.jpg',
      'Pierce Brown/Red Rising/Red Rising.m4b',
    ]);
  });

  it('tells books in one folder apart by the albums they are tagged with', async () => {
    const folder = join(root, 'downloads', 'Saga');

    await mkdir(folder, { recursive: true });

    for (const name of Object.keys(TAGS)) {
      await writeFile(join(folder, name), name);
    }

    await fileBook(
      { libraryPath: join(root, 'Books'), title: 'Saga', artistName: null },
      [{ id: 'book', title: 'Saga' }],
      folder,
      false,
      { readTags },
    );

    expect(await filesUnder(join(root, 'Books'))).toEqual([
      'Pierce Brown/Golden Son/Golden Son.m4b',
      'Pierce Brown/Iron Gold/Iron Gold.m4b',
      'Pierce Brown/Red Rising/Red Rising.m4b',
    ]);
  });

  it('tells untagged books apart by their folders', async () => {
    const saga = await aSaga();

    await fileBook(
      { libraryPath: join(root, 'Books'), title: 'Saga', artistName: 'Pierce Brown' },
      [{ id: 'book', title: 'Saga' }],
      saga,
      true,
      { readTags: () => Promise.resolve(null) },
    );

    expect(await filesUnder(join(root, 'Books', 'Pierce Brown'))).toEqual([
      'Pierce Brown-Red Rising-#1-Red Rising/Pierce Brown-Red Rising-#1-Red Rising.m4b',
      'Pierce Brown-Red Rising-#2-Golden Son/Pierce Brown-Red Rising-#2-Golden Son.m4b',
      'Pierce Brown-Red Rising-#4-Iron Gold/Pierce Brown-Red Rising-#4-Iron Gold.m4b',
      'Pierce Brown-Red Rising-#4-Iron Gold/cover.jpg',
    ]);
  });

  it('names a single book sent by hand by its tags, where it is asked to', async () => {
    const download = await aDownload(['Iron Gold (Unabridged).m4b']);

    const { filed } = await fileBook(
      { libraryPath: join(root, 'Books'), title: 'Pierce Brown', artistName: 'Iron Gold' },
      [{ id: 'book', title: 'Pierce Brown' }],
      download,
      true,
      { isNamedByItsFiles: true, readTags },
    );

    expect(filed.get('book')).toBe(join(root, 'Books', 'Pierce Brown', 'Iron Gold'));
  });

  it('keeps a request’s own name for a single book', async () => {
    const download = await aDownload(['Iron Gold (Unabridged).m4b']);

    await fileBook(aRequest(), DUNE, download, true, { readTags });

    expect(await filesUnder(join(root, 'Books'))).toEqual(['Frank Herbert/Dune/Dune.m4b']);
  });
});
