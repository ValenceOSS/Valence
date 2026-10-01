import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { book, library, user, viewerProfile } from '#dialect/Schema';
import { createDatabaseBookService } from './createDatabaseBookService';
import type { BookMatching } from './BookMatching';
import type { BookRow } from './scanBookLibrary';

const STARTING_POSTGRES_MS = 60_000;

const SERVER = { kind: 'server' } as const;

const DUNE: BookRow = {
  libraryId: 'books',
  path: '/books/Dune',
  title: 'Dune',
  layout: 'reflow',
  direction: 'leftToRight',
  year: 1965,
  authors: ['Frank Herbert'],
  overview: 'Spice.',
  series: null,
};

/**
 * A chapter of Dune as a scan would find it.
 *
 * @param path - Where its file is.
 * @param number - Which chapter it is.
 * @param format - What kind of file it is.
 * @returns The chapter.
 */
const chapterOf = (path: string, number: number, format: 'epub' | 'mp3' = 'epub') => ({
  bookPath: DUNE.path,
  path,
  number,
  title: `Part ${number.toString()}`,
  format,
  pageCount: format === 'epub' ? 100 : null,
  durationSeconds: format === 'mp3' ? 600 : null,
  marks: [],
  sizeBytes: 1000,
  modifiedAtMs: 1,
});

const MATCHING: BookMatching = {
  search: () => Promise.resolve([]),
  describe: () =>
    Promise.resolve({
      title: 'Dune (corrected)',
      year: 1966,
      overview: 'Corrected.',
      posterUrl: null,
      authors: ['F. Herbert'],
      subjects: [],
    }),
  picture: () => Promise.resolve(null),
};

/**
 * A book service over a fresh database holding a book library and one profile reading from it.
 *
 * @returns The service and the database under it.
 */
const aShelf = async () => {
  const db = await aMigratedDatabase();

  await db.insert(user).values({ id: 'ada', name: 'Ada', email: 'ada@example.com' });
  await db
    .insert(viewerProfile)
    .values({ id: 'reader', userId: 'ada', name: 'Ada', colour: 'pink' });
  await db.insert(library).values({ id: 'books', name: 'Books', kind: 'books', path: '/books' });

  const service = createDatabaseBookService(
    db,
    await mkdtemp(join(tmpdir(), 'valence-books-')),
    MATCHING,
  );

  return { db, service };
};

describe('createDatabaseBookService', { timeout: STARTING_POSTGRES_MS }, () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('hands back the same id when a book is scanned again, keeping a correction over the file', async () => {
    const { service } = await aShelf();
    const first = await service.upsertBook(DUNE);

    await expect(service.correct(first ?? '', 1)).resolves.toBe(true);

    const again = await service.upsertBook({ ...DUNE, title: 'dune', authors: ['Herbert'] });

    expect(again).toBe(first);
    expect((await service.find(SERVER, {}))[0]).toMatchObject({
      title: 'Dune (corrected)',
      authors: ['F. Herbert'],
      year: 1966,
    });

    await expect(service.forgetCorrection(first ?? '')).resolves.toBe(true);
    await service.upsertBook({ ...DUNE, title: 'dune', authors: ['Herbert'] });

    expect((await service.find(SERVER, {}))[0]).toMatchObject({
      title: 'dune',
      authors: ['Herbert'],
    });
  });

  it('says a correction or its forgetting changed nothing for a book that is not there', async () => {
    const { service } = await aShelf();

    await expect(service.correct('missing', 1)).resolves.toBe(false);
    await expect(service.forgetCorrection('missing')).resolves.toBe(false);
  });

  it('keeps one row per chapter however often it is scanned, and counts what is heard', async () => {
    const { service } = await aShelf();

    await service.upsertBook(DUNE);
    await service.upsertChapter('books', chapterOf('/books/Dune/1.epub', 1));
    await service.upsertChapter('books', chapterOf('/books/Dune/1.epub', 1));
    await service.upsertChapter('books', chapterOf('/books/Dune/2.mp3', 2, 'mp3'));

    expect((await service.find(SERVER, {}))[0]).toMatchObject({
      chapterCount: 2,
      hasText: true,
      hasAudio: true,
      sizeBytes: 2000,
    });
  });

  it('finds a book by its title, overview or author whatever the case', async () => {
    const { service } = await aShelf();

    await service.upsertBook(DUNE);

    for (const search of ['dUNE', 'SPICE', 'herbert']) {
      expect((await service.find(SERVER, { search })).map((one) => one.title)).toEqual(['Dune']);
    }

    await expect(service.find(SERVER, { search: 'Asimov' })).resolves.toEqual([]);
  });

  it('keeps one place per chapter, and lists each book by the place read most recently', async () => {
    const { db, service } = await aShelf();
    const bookId = (await service.upsertBook(DUNE)) ?? '';

    await service.upsertChapter('books', chapterOf('/books/Dune/1.epub', 1));
    await service.upsertChapter('books', chapterOf('/books/Dune/2.epub', 2));

    const chapters = (await service.read(bookId))?.chapters ?? [];
    const [one, two] = chapters.map((chapter) => chapter.id);

    vi.useFakeTimers({ toFake: ['Date'] });

    vi.setSystemTime(Date.UTC(2026, 8, 30, 20, 0));
    await service.saveProgress('reader', one ?? '', {
      pageNumber: 5,
      fraction: null,
      isFinished: false,
    });
    vi.setSystemTime(Date.UTC(2026, 8, 30, 20, 1));
    await service.saveProgress('reader', two ?? '', {
      pageNumber: 2,
      fraction: null,
      isFinished: false,
    });
    vi.setSystemTime(Date.UTC(2026, 8, 30, 20, 2));
    await service.saveProgress('reader', one ?? '', {
      pageNumber: 9,
      fraction: null,
      isFinished: false,
    });

    const places = await service.readProgress('reader', bookId);

    expect(places).toHaveLength(2);
    expect(places.find((place) => place.chapterId === one)?.pageNumber).toBe(9);

    const reading = await service.listReading(SERVER, 'reader', 10);

    expect(reading).toHaveLength(1);
    expect(reading[0]).toMatchObject({ chapterId: one, pageNumber: 9 });
    expect((await db.select().from(book).where(eq(book.id, bookId))).length).toBe(1);
  });

  it('keeps one place in an audiobook, moved on each time it is saved', async () => {
    const { service } = await aShelf();
    const bookId = (await service.upsertBook(DUNE)) ?? '';

    await service.upsertChapter('books', chapterOf('/books/Dune/1.mp3', 1, 'mp3'));
    await service.upsertChapter('books', chapterOf('/books/Dune/2.mp3', 2, 'mp3'));

    const [one, two] = ((await service.read(bookId))?.chapters ?? []).map((chapter) => chapter.id);

    await service.saveListening('reader', bookId, {
      chapterId: one ?? '',
      positionSeconds: 30,
      isFinished: false,
    });
    await service.saveListening('reader', bookId, {
      chapterId: two ?? '',
      positionSeconds: 45,
      isFinished: false,
    });

    await expect(service.readListening('reader', bookId)).resolves.toMatchObject({
      chapterId: two,
      positionSeconds: 45,
    });
  });
});
