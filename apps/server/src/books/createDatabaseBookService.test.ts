import { access, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { book, library, user, viewerProfile } from '#dialect/Schema';
import { createDatabaseBookService } from './createDatabaseBookService';
import { openBookFile } from './openBookFile';
import type { BookMatching } from './BookMatching';
import type { BookRow } from './scanBookLibrary';

vi.mock('./openBookFile', () => ({ openBookFile: vi.fn() }));

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

  const cacheDir = await mkdtemp(join(tmpdir(), 'valence-books-'));
  const service = createDatabaseBookService(db, cacheDir, MATCHING);

  return { db, service, cacheDir };
};

describe('createDatabaseBookService', { timeout: STARTING_POSTGRES_MS }, () => {
  beforeEach(() => {
    vi.mocked(openBookFile).mockReset().mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('hands back the same id when a book is scanned again, keeping a correction over the file', async () => {
    const { service } = await aShelf();
    const first = await service.upsertBook(DUNE);

    await service.upsertChapter('books', chapterOf('/books/Dune/1.epub', 1));
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

  it('falls back to the folder art when the cover inside an audiobook will not draw', async () => {
    const { db, service, cacheDir } = await aShelf();
    const folder = join(cacheDir, 'Dune');

    await mkdir(folder);
    await db.update(library).set({ path: cacheDir }).where(eq(library.id, 'books'));
    await writeFile(
      join(folder, 'cover.png'),
      await sharp({ create: { width: 8, height: 8, channels: 3, background: '#fff' } })
        .png()
        .toBuffer(),
    );

    const id = await service.upsertBook({ ...DUNE, path: folder });

    await service.upsertChapter('books', {
      ...chapterOf(join(folder, '1.mp3'), 1, 'mp3'),
      bookPath: folder,
    });
    vi.mocked(openBookFile).mockResolvedValueOnce({
      layout: 'audio',
      durationSeconds: 600,
      marks: [],
      track: null,
      readCover: () =>
        Promise.resolve({ bytes: Uint8Array.from([1, 2, 3]), contentType: 'image/jpeg' }),
    });

    expect(await service.readCover(id ?? '')).toMatchObject({ contentType: 'image/webp' });
  });

  it('says a correction or its forgetting changed nothing for a book that is not there', async () => {
    const { service } = await aShelf();

    await expect(service.correct('missing', 1)).resolves.toBe(false);
    await expect(service.forgetCorrection('missing')).resolves.toBe(false);
  });

  it('touches no file for a book that is not there, whatever its id spells', async () => {
    const { service, cacheDir } = await aShelf();
    const elsewhere = join(cacheDir, 'elsewhere.webp');

    await writeFile(elsewhere, 'not a cover');

    await expect(service.forgetCorrection('../elsewhere')).resolves.toBe(false);
    await expect(access(elsewhere)).resolves.toBeUndefined();
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

  it('keeps a book whose chapters go missing out of sight, without forgetting it, until they return', async () => {
    const { db, service } = await aShelf();
    const id = (await service.upsertBook(DUNE)) ?? '';
    const gone = new Date('2026-09-01T00:00:00.000Z');

    await service.upsertChapter('books', chapterOf('/books/Dune/1.epub', 1));
    await service.upsertChapter('books', chapterOf('/books/Dune/2.epub', 2));
    await service.setAside('books', ['/books/Dune/2.epub'], gone);

    expect((await service.find(SERVER, {}))[0]).toMatchObject({ chapterCount: 1 });
    expect((await service.read(id))?.chapters.map((chapter) => chapter.number)).toEqual([1]);

    await service.setAside('books', ['/books/Dune/1.epub'], gone);
    await service.markScanned('books');

    await expect(service.find(SERVER, {})).resolves.toEqual([]);
    await expect(service.read(id)).resolves.toBeNull();
    await expect(db.select({ id: book.id }).from(book)).resolves.toEqual([{ id }]);
    await expect(
      service.listMissingSince('books', new Date('2026-09-02T00:00:00.000Z')),
    ).resolves.toEqual(expect.arrayContaining(['/books/Dune/1.epub', '/books/Dune/2.epub']));

    await service.markFound('books', ['/books/Dune/1.epub', '/books/Dune/2.epub']);

    expect((await service.find(SERVER, {}))[0]).toMatchObject({ chapterCount: 2 });
    await expect(
      service.listMissingSince('books', new Date('2026-10-23T00:00:00.000Z')),
    ).resolves.toEqual([]);
  });

  it('finds a book by its title, overview or author whatever the case', async () => {
    const { service } = await aShelf();

    await service.upsertBook(DUNE);
    await service.upsertChapter('books', chapterOf('/books/Dune/1.epub', 1));

    for (const search of ['dUNE', 'SPICE', 'herbert']) {
      expect((await service.find(SERVER, { search })).map((one) => one.title)).toEqual(['Dune']);
    }

    await expect(service.find(SERVER, { search: 'Asimov' })).resolves.toEqual([]);
  });

  it('opens a book at no place in a chapter that has gone missing, and keeps that place for its return', async () => {
    const { service } = await aShelf();
    const bookId = (await service.upsertBook(DUNE)) ?? '';

    await service.upsertChapter('books', chapterOf('/books/Dune/1.epub', 1));
    await service.upsertChapter('books', chapterOf('/books/Dune/2.epub', 2));

    const [one, two] = ((await service.read(bookId))?.chapters ?? []).map((chapter) => chapter.id);
    const place = { pageNumber: 5, fraction: null, isFinished: false };

    await service.saveProgress('reader', one ?? '', place);
    await service.saveProgress('reader', two ?? '', place);
    await service.setAside('books', ['/books/Dune/2.epub'], new Date('2026-10-01T00:00:00.000Z'));

    expect((await service.readProgress('reader', bookId)).map((row) => row.chapterId)).toEqual([
      one,
    ]);
    await expect(service.canReach(null, bookId, two)).resolves.toBe(false);
    await expect(service.saveProgress('reader', two ?? '', place)).resolves.toBe(false);

    await service.markFound('books', ['/books/Dune/2.epub']);

    expect(
      (await service.readProgress('reader', bookId)).map((row) => row.chapterId).toSorted(),
    ).toEqual([one, two].toSorted());
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

  it('keeps bookmarks in the order they come in the book, and none in a chapter gone missing', async () => {
    const { service } = await aShelf();
    const bookId = (await service.upsertBook(DUNE)) ?? '';

    await service.upsertChapter('books', chapterOf('/books/Dune/2.epub', 2));
    await service.upsertChapter('books', chapterOf('/books/Dune/1.epub', 1));

    const [one, two] = ((await service.read(bookId))?.chapters ?? []).map((chapter) => chapter.id);
    const bare = { pageShown: null, excerpt: null, picture: null };

    await expect(
      service.saveBookmark('reader', 'mark-c', {
        chapterId: two ?? '',
        pageNumber: null,
        fraction: 0.1,
        ...bare,
      }),
    ).resolves.toBe(true);
    await service.saveBookmark('reader', 'mark-b', {
      chapterId: one ?? '',
      pageNumber: null,
      fraction: 0.75,
      pageShown: null,
      excerpt: 'The spice must flow.',
      picture: null,
    });
    await service.saveBookmark('reader', 'mark-a', {
      chapterId: one ?? '',
      pageNumber: null,
      fraction: 0.25,
      ...bare,
    });

    const marks = await service.readBookmarks('reader', bookId);

    expect(marks.map((mark) => mark.id)).toEqual(['mark-a', 'mark-b', 'mark-c']);
    expect(marks[1]).toMatchObject({
      bookId,
      chapterId: one,
      pageNumber: null,
      fraction: 0.75,
      pageShown: null,
      excerpt: 'The spice must flow.',
      picture: null,
    });
    expect(Number.isNaN(Date.parse(marks[1]?.createdAt ?? ''))).toBe(false);

    await service.setAside('books', ['/books/Dune/2.epub'], new Date('2026-10-01T00:00:00.000Z'));

    expect((await service.readBookmarks('reader', bookId)).map((mark) => mark.id)).toEqual([
      'mark-a',
      'mark-b',
    ]);
    await expect(
      service.saveBookmark('reader', 'mark-d', {
        chapterId: two ?? '',
        pageNumber: 1,
        fraction: null,
        ...bare,
      }),
    ).resolves.toBe(false);
  });

  it('keeps a bookmark once, to the profile that made it, and removes it for that profile alone', async () => {
    const { db, service } = await aShelf();
    const bookId = (await service.upsertBook(DUNE)) ?? '';

    await db
      .insert(viewerProfile)
      .values({ id: 'another', userId: 'ada', name: 'Another', colour: 'blue' });
    await service.upsertChapter('books', chapterOf('/books/Dune/1.epub', 1));

    const [one] = ((await service.read(bookId))?.chapters ?? []).map((chapter) => chapter.id);
    const place = {
      chapterId: one ?? '',
      pageNumber: 3,
      fraction: null,
      pageShown: null,
      excerpt: null,
      picture: null,
    };

    await expect(service.saveBookmark('reader', 'mark', place)).resolves.toBe(true);
    await expect(service.saveBookmark('reader', 'mark', place)).resolves.toBe(true);
    await expect(
      service.saveBookmark('another', 'mark', { ...place, pageNumber: 9 }),
    ).resolves.toBe(false);
    await service.forgetBookmark('another', 'mark');

    expect((await service.readBookmarks('reader', bookId)).map((mark) => mark.pageNumber)).toEqual([
      3,
    ]);
    await expect(service.readBookmarks('another', bookId)).resolves.toEqual([]);

    await service.forgetBookmark('reader', 'mark');

    await expect(service.readBookmarks('reader', bookId)).resolves.toEqual([]);
  });

  it('says there is no chapter to bookmark where there is none', async () => {
    const { service } = await aShelf();

    await expect(
      service.saveBookmark('reader', 'mark', {
        chapterId: 'nowhere',
        pageNumber: 1,
        fraction: null,
        pageShown: null,
        excerpt: null,
        picture: null,
      }),
    ).resolves.toBe(false);
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
