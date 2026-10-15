import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
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
    .filter((entry) => entry.isFile() && entry.name !== 'metadata.opf')
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

  it('files neither format from a download holding only the other', async () => {
    const download = await aDownload(['Dune.epub']);

    expect(
      await fileBook(
        aRequest(),
        [{ id: 'heard', title: 'Dune', format: 'audiobook' }],
        download,
        true,
      ),
    ).toEqual({ filed: new Map(), missing: ['heard'], books: [] });
  });

  it('says nothing could be filed from a download with no book in it', async () => {
    const download = await aDownload(['cover.jpg', 'Dune.cue']);

    expect(await fileBook(aRequest(), DUNE, download, true)).toEqual({
      filed: new Map(),
      missing: ['dune'],
      books: [],
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

  it('files each book as its own in its series, named by its tags, each with only its own cover', async () => {
    const saga = await aSaga();

    const { filed } = await fileBook(
      { libraryPath: join(root, 'Books'), title: 'Red Rising Saga Books 1-5', artistName: null },
      [{ id: 'book', title: 'Red Rising Saga Books 1-5' }],
      saga,
      true,
      { readTags },
    );

    expect(filed.get('book')).toBe(join(root, 'Books', 'Pierce Brown', 'Red Rising'));
    expect(await filesUnder(join(root, 'Books'))).toEqual([
      'Pierce Brown/Red Rising/1 - Red Rising/Red Rising.m4b',
      'Pierce Brown/Red Rising/2 - Golden Son/Golden Son.m4b',
      'Pierce Brown/Red Rising/4 - Iron Gold/Iron Gold.m4b',
      'Pierce Brown/Red Rising/4 - Iron Gold/cover.jpg',
    ]);
  });

  it('files a book of a pack the library keeps on its own beside it, and the book asked for in its own folder', async () => {
    const pack = join(root, 'downloads', 'A Long Road [1-3]');

    for (const name of [
      '1 - The First Step/The First Step.m4b',
      '2 - The Second Step/The Second Step.m4b',
      '3 - The Third Step/The Third Step.m4b',
    ]) {
      await mkdir(join(pack, name, '..'), { recursive: true });
      await writeFile(join(pack, name), name);
    }

    const kept = join(root, 'Books', 'An Author', 'The First Step');
    const toRead = join(root, 'Books', 'An Author', 'The Second Step');

    await mkdir(kept, { recursive: true });
    await writeFile(join(kept, 'The First Step.m4b'), 'mine');
    await mkdir(toRead, { recursive: true });
    await writeFile(join(toRead, 'The Second Step.epub'), 'mine');

    const { filed, books } = await fileBook(
      {
        libraryPath: join(root, 'Books'),
        title: 'The Second Step',
        artistName: 'An Author',
        narrations: [
          {
            asin: 'B000000001',
            narrators: ['A Narrator'],
            runtimeMinutes: 600,
            series: 'A Long Road',
          },
        ],
      },
      [{ id: 'book', title: 'The Second Step', format: 'audiobook' }],
      pack,
      true,
      { readTags: () => Promise.resolve(null) },
    );

    expect(filed.get('book')).toBe(toRead);
    expect(await readFile(join(kept, 'The First Step.m4b'), 'utf8')).toBe('mine');
    expect(await filesUnder(join(root, 'Books'))).toEqual([
      'An Author/A Long Road/3 - The Third Step/The Third Step.m4b',
      'An Author/The First Step/The First Step.m4b',
      'An Author/The Second Step/The Second Step.epub',
      'An Author/The Second Step/The Second Step.m4b',
    ]);
    expect(books?.map(({ title, formats, parts }) => ({ title, formats, parts }))).toEqual([
      { title: 'The First Step', formats: ['audiobook'], parts: { count: 1, missing: [] } },
      { title: 'The Second Step', formats: ['audiobook'], parts: { count: 1, missing: [] } },
      { title: 'The Third Step', formats: ['audiobook'], parts: { count: 1, missing: [] } },
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

  it('tells untagged books apart by their folders, named and placed by them', async () => {
    const saga = await aSaga();

    await fileBook(
      { libraryPath: join(root, 'Books'), title: 'Saga', artistName: 'Pierce Brown' },
      [{ id: 'book', title: 'Saga' }],
      saga,
      true,
      { readTags: () => Promise.resolve(null) },
    );

    expect(await filesUnder(join(root, 'Books', 'Pierce Brown'))).toEqual([
      'Red Rising/1 - Red Rising/Red Rising.m4b',
      'Red Rising/2 - Golden Son/Golden Son.m4b',
      'Red Rising/4 - Iron Gold/Iron Gold.m4b',
      'Red Rising/4 - Iron Gold/cover.jpg',
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

  it('files a book to read beside the same book to hear, already in its series', async () => {
    await mkdir(join(root, 'Books', 'Pierce Brown', 'Red Rising', '2 - Golden Son'), {
      recursive: true,
    });

    const download = await aDownload(['Golden Son.epub']);
    const { filed } = await fileBook(
      { libraryPath: join(root, 'Books'), title: 'Golden Son', artistName: 'Pierce Brown' },
      [{ id: 'book', title: 'Golden Son' }],
      download,
      true,
      { readTags },
    );

    expect(filed.get('book')).toBe(
      join(root, 'Books', 'Pierce Brown', 'Red Rising', '2 - Golden Son'),
    );
    expect(await filesUnder(join(root, 'Books'))).toEqual([
      'Pierce Brown/Red Rising/2 - Golden Son/Golden Son.epub',
    ]);
  });

  it('keeps a request’s own name for a single book', async () => {
    const download = await aDownload(['Iron Gold (Unabridged).m4b']);

    await fileBook(aRequest(), DUNE, download, true, { readTags });

    expect(await filesUnder(join(root, 'Books'))).toEqual(['Frank Herbert/Dune/Dune.m4b']);
  });

  it('writes what is known of the book beside it, and a cover where the download brought none', async () => {
    const download = await aDownload(['Book.m4b']);
    const covers: string[] = [];

    await fileBook(
      {
        ...aRequest(),
        title: 'A Book',
        artistName: 'An Author',
        year: 2020,
        overview: null,
        openLibraryId: 7,
        posterUrl: 'https://covers.openlibrary.org/b/id/9-M.jpg',
        narrations: [
          { asin: 'A', narrators: ['A Reader'], runtimeMinutes: 600, series: 'A Series' },
        ],
      },
      [{ id: 'book', title: 'A Book', format: 'audiobook', narration: 'A' }],
      download,
      true,
      {
        fetchCover: (url) => {
          covers.push(url);

          return Promise.resolve(new Uint8Array([1]));
        },
      },
    );

    const folder = join(root, 'Books', 'An Author', 'A Book');
    const opf = await readFile(join(folder, 'metadata.opf'), 'utf8');

    expect(opf).toContain('<dc:contributor opf:role="nrt">A Reader</dc:contributor>');
    expect(opf).toContain('<meta name="calibre:series" content="A Series"/>');
    expect(covers).toEqual(['https://covers.openlibrary.org/b/id/9-L.jpg']);
    expect(await filesUnder(folder)).toEqual(['A Book.m4b', 'cover.jpg']);
  });

  it('never replaces what the library already keeps beside a book', async () => {
    const folder = join(root, 'Books', 'An Author', 'A Book');

    await mkdir(folder, { recursive: true });
    await writeFile(join(folder, 'metadata.opf'), 'kept');
    await writeFile(join(folder, 'A Book.mobi'), 'kept');

    await fileBook(
      { ...aRequest(), title: 'A Book', artistName: 'An Author' },
      [{ id: 'book', title: 'A Book' }],
      await aDownload(['Book.m4b']),
      true,
      { fetchCover: () => Promise.resolve(null) },
    );

    expect(await readFile(join(folder, 'metadata.opf'), 'utf8')).toBe('kept');
    expect(await readFile(join(folder, 'A Book.mobi'), 'utf8')).toBe('kept');
  });
});
