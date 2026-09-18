import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { BookContentsSchema, ReadingProgressSchema } from '@ValenceContracts/schemas/Book';
import { createMemoryBookService } from './createMemoryBookService';
import type { Book, BookChapter } from '@ValenceContracts/schemas/Book';

const BASE = 'http://localhost:8420';
const LIBRARY_ID = '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f';
const NOVEL_ID = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0001';
const NOVEL_CHAPTER = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0002';
const MANGA_ID = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0003';
const MANGA_CHAPTER = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0004';

const A_BOOK: Book = {
  id: NOVEL_ID,
  libraryId: LIBRARY_ID,
  title: 'Pride and Prejudice',
  layout: 'reflow',
  direction: 'leftToRight',
  year: 1813,
  overview: null,
  genres: null,
  authors: ['Jane Austen'],
  rating: null,
  hasCover: true,
  chapterCount: 1,
  addedAt: '2026-09-18T00:00:00.000Z',
  updatedAt: '2026-09-18T00:00:00.000Z',
};

const A_CHAPTER: BookChapter = {
  id: NOVEL_CHAPTER,
  bookId: NOVEL_ID,
  number: 0,
  title: 'Pride and Prejudice',
  format: 'epub',
  pageCount: null,
  addedAt: '2026-09-18T00:00:00.000Z',
};

const CONTENTS = {
  parts: [{ size: 1200 }, { size: 3400 }],
  contents: [
    { title: 'Chapter I.', part: 0, anchor: null, depth: 0 },
    { title: 'Chapter II.', part: 1, anchor: 'c2', depth: 0 },
  ],
};

const build = () => {
  const { auth, settings } = createMemoryAuth();
  const app = createApp({
    auth,
    settings,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService({
      libraries: [
        {
          id: LIBRARY_ID,
          name: 'Books',
          kind: 'books',
          path: '/media/books',
          itemCount: 2,
          lastScannedAt: null,
          defaultAudioLanguage: null,
          filesAtOnce: null,
        },
      ],
      media: [],
    }),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    profiles: createMemoryProfileService(),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    books: createMemoryBookService({
      books: [
        A_BOOK,
        { ...A_BOOK, id: MANGA_ID, title: 'Rent-A-Girlfriend', layout: 'fixed', authors: null },
      ],
      chapters: [
        A_CHAPTER,
        { ...A_CHAPTER, id: MANGA_CHAPTER, bookId: MANGA_ID, format: 'cbz', pageCount: 20 },
      ],
      contents: { [NOVEL_CHAPTER]: CONTENTS },
      documents: {
        [`${NOVEL_CHAPTER}:0`]: '<p>It is a truth universally acknowledged.</p>',
        [`${NOVEL_CHAPTER}:1`]: '<p id="c2">Mr. Bennet.</p><img src="{picture}"/>',
      },
    }),
  });

  return { app };
};

/**
 * Somebody signed in, and the cookie that says so.
 */
const signedIn = async (app: ReturnType<typeof build>['app']): Promise<string> => {
  const response = await app.request(`${BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: BASE },
    body: JSON.stringify({
      name: 'Marques',
      email: 'marques@valence.local',
      password: 'a-long-enough-password',
    }),
  });

  return response.headers.getSetCookie()[0]?.split(';')[0] ?? '';
};

/**
 * Asks for something about a book, signed in.
 */
const ask = async (path: string, init: RequestInit = {}) => {
  const { app } = build();
  const cookie = await signedIn(app);

  return app.request(`${BASE}${path}`, {
    ...init,
    headers: { cookie, origin: BASE, 'content-type': 'application/json' },
  });
};

describe('reading an ebook over HTTP', () => {
  it('says how a book that reflows is divided', async () => {
    const response = await ask(`/api/books/${NOVEL_ID}/chapters/${NOVEL_CHAPTER}/contents`);

    expect(response.status).toBe(200);
    expect(BookContentsSchema.parse(await response.json())).toEqual(CONTENTS);
  });

  it('says a book of pages has no contents of that kind', async () => {
    const response = await ask(`/api/books/${MANGA_ID}/chapters/${MANGA_CHAPTER}/contents`);

    expect(response.status).toBe(404);
  });

  it('serves the part of a book it is asked for, as a page of text', async () => {
    const response = await ask(`/api/books/${NOVEL_ID}/chapters/${NOVEL_CHAPTER}/document?part=0`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(await response.text()).toContain('truth universally acknowledged');
  });

  it('points the pictures in a part back at the book they are in', async () => {
    const response = await ask(`/api/books/${NOVEL_ID}/chapters/${NOVEL_CHAPTER}/document?part=1`);

    expect(await response.text()).toContain(
      `/api/books/${NOVEL_ID}/chapters/${NOVEL_CHAPTER}/resource?href=picture.png`,
    );
  });

  it('says nothing of a part the book does not have', async () => {
    const response = await ask(`/api/books/${NOVEL_ID}/chapters/${NOVEL_CHAPTER}/document?part=7`);

    expect(response.status).toBe(404);
  });

  it('will not guess which part is wanted', async () => {
    const response = await ask(`/api/books/${NOVEL_ID}/chapters/${NOVEL_CHAPTER}/document`);

    expect(response.status).toBe(400);
  });

  it('serves a picture from inside the book', async () => {
    const response = await ask(
      `/api/books/${NOVEL_ID}/chapters/${NOVEL_CHAPTER}/resource?href=picture.png`,
    );

    expect(response.status).toBe(200);
  });

  it('serves the cover of an ebook', async () => {
    expect((await ask(`/api/books/${NOVEL_ID}/cover`)).status).toBe(200);
  });

  it('remembers how far through a book somebody is, as a fraction of it', async () => {
    const { app } = build();
    const cookie = await signedIn(app);
    const headers = { cookie, origin: BASE, 'content-type': 'application/json' };

    const saved = await app.request(
      `${BASE}/api/books/${NOVEL_ID}/chapters/${NOVEL_CHAPTER}/progress`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({ pageNumber: null, fraction: 0.4, isFinished: false }),
      },
    );
    const read = await app.request(`${BASE}/api/books/${NOVEL_ID}/progress`, { headers });

    expect(saved.status).toBe(204);
    expect(
      z.object({ progress: z.array(ReadingProgressSchema) }).parse(await read.json()).progress[0]
        ?.fraction,
    ).toBe(0.4);
  });
});
