import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '@ValenceServer/App';
import { signUpForTest } from '@ValenceServer/auth/signUpForTest';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemoryShareService } from '@ValenceServer/sharing/createMemoryShareService';
import { createShareSessions } from '@ValenceServer/sharing/createShareSessions';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { DEFAULT_ROLE_NAME } from '@ValenceCore/functions/defaultRoles';
import {
  BookContentsSchema,
  BookmarkListSchema,
  BookReadingListSchema,
  BookSchema,
  ReadingProgressSchema,
} from '@ValenceContracts/schemas/Book';
import { CreatedShareSchema } from '@ValenceContracts/schemas/Share';
import { FavouriteListSchema } from '@ValenceContracts/schemas/Favourite';
import { HouseholdRatingSchema } from '@ValenceContracts/schemas/Rating';
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

const SessionAccountSchema = z.object({ user: z.object({ id: z.string() }) });

const build = (options: { refusesEveryAccount?: boolean } = {}) => {
  const { auth, settings } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
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
          takesRequests: true,
          requestProfileId: null,
          requestPath: null,
          keepsShowsTogether: true,
          higherProfileAsks: 'ask',
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
      ...(options.refusesEveryAccount === true
        ? { refuses: (viewer) => viewer.kind === 'account' }
        : {}),
      documents: {
        [`${NOVEL_CHAPTER}:0`]: '<p>It is a truth universally acknowledged.</p>',
        [`${NOVEL_CHAPTER}:1`]: '<p id="c2">Mr. Bennet.</p><img src="{picture}"/>',
      },
    }),
    shares: createMemoryShareService({
      shares: [],
      titles: { [NOVEL_ID]: 'Pride and Prejudice' },
    }),
    shareSessions: createShareSessions(),
    permissions,
  });

  return { app, auth, permissions };
};

/**
 * Somebody signed in, and the cookie that says so.
 */
const signedIn = async (
  built: ReturnType<typeof build>,
  who: { name: string; email: string } = { name: 'Marques', email: 'marques@valence.local' },
): Promise<string> => {
  const cookie = await signUpForTest(built.app, built.auth, {
    ...who,
    password: 'a-long-enough-password',
  });
  const session = await built.app.request(`${BASE}/api/auth/get-session`, {
    headers: { cookie, origin: BASE },
  });
  const said = SessionAccountSchema.safeParse(await session.json());
  const member = built.permissions.state.roles.find((one) => one.name === DEFAULT_ROLE_NAME);

  if (said.success && member !== undefined) {
    built.permissions.state.assignments[said.data.user.id] = [member.id];
  }

  return cookie;
};

/**
 * Somebody signed in, and a way to ask the server things as them.
 */
const asSomebody = async (options: { refusesEveryAccount?: boolean } = {}) => {
  const built = build(options);
  const cookie = await signedIn(built);

  return (path: string, init: RequestInit = {}) =>
    built.app.request(`${BASE}${path}`, {
      ...init,
      headers: { cookie, origin: BASE, 'content-type': 'application/json' },
    });
};

/**
 * Asks for something about a book, signed in.
 */
const ask = async (path: string, init: RequestInit = {}) => (await asSomebody())(path, init);

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
    const asking = await asSomebody();

    const saved = await asking(`/api/books/${NOVEL_ID}/chapters/${NOVEL_CHAPTER}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ pageNumber: null, fraction: 0.4, isFinished: false }),
    });
    const read = await asking(`/api/books/${NOVEL_ID}/progress`);

    expect(saved.status).toBe(204);
    expect(
      z.object({ progress: z.array(ReadingProgressSchema) }).parse(await read.json()).progress[0]
        ?.fraction,
    ).toBe(0.4);
  });
});

describe('keeping books out of reach over HTTP', () => {
  it('keeps a book from somebody whose account was refused its library', async () => {
    const asking = await asSomebody({ refusesEveryAccount: true });

    expect((await asking(`/api/books/${NOVEL_ID}`)).status).toBe(404);
    expect((await asking(`/api/books/${NOVEL_ID}/cover`)).status).toBe(404);
    expect(
      (await asking(`/api/books/${NOVEL_ID}/chapters/${NOVEL_CHAPTER}/document?part=0`)).status,
    ).toBe(404);
  });

  it('will not serve a chapter through a book it is not in', async () => {
    const response = await ask(`/api/books/${MANGA_ID}/chapters/${NOVEL_CHAPTER}/contents`);

    expect(response.status).toBe(404);
  });

  it('lists nothing from a library the account was refused', async () => {
    const asking = await asSomebody({ refusesEveryAccount: true });
    const response = await asking(`/api/libraries/${LIBRARY_ID}/books`);

    expect(z.object({ books: z.array(BookSchema) }).parse(await response.json()).books).toEqual([]);
  });
});

describe('finding books over HTTP', () => {
  it('finds a book by who wrote it, across every library', async () => {
    const response = await ask('/api/books?search=austen');
    const found = z.object({ books: z.array(BookSchema) }).parse(await response.json()).books;

    expect(found.map((one) => one.title)).toEqual(['Pride and Prejudice']);
  });

  it('finds books by id, for whatever holds a list of them', async () => {
    const response = await ask(`/api/books?ids=${MANGA_ID}`);
    const found = z.object({ books: z.array(BookSchema) }).parse(await response.json()).books;

    expect(found.map((one) => one.id)).toEqual([MANGA_ID]);
  });
});

describe('keeping and rating a book over HTTP', () => {
  it('keeps a book, and lists it beside what was kept to watch', async () => {
    const asking = await asSomebody();

    expect((await asking(`/api/books/${NOVEL_ID}/favourite`, { method: 'PUT' })).status).toBe(204);

    const listed = FavouriteListSchema.parse(await (await asking('/api/favourites')).json());

    expect(listed.books.map((one) => one.bookId)).toEqual([NOVEL_ID]);

    await asking(`/api/books/${NOVEL_ID}/favourite`, { method: 'DELETE' });

    expect(FavouriteListSchema.parse(await (await asking('/api/favourites')).json()).books).toEqual(
      [],
    );
  });

  it('will not keep a book the viewer cannot see', async () => {
    const asking = await asSomebody({ refusesEveryAccount: true });

    expect((await asking(`/api/books/${NOVEL_ID}/favourite`, { method: 'PUT' })).status).toBe(404);
  });

  it('rates a book, and says what the household gave it', async () => {
    const asking = await asSomebody();

    const rated = await asking(`/api/books/${NOVEL_ID}/rating`, {
      method: 'PUT',
      body: JSON.stringify({ stars: 5 }),
    });
    const household = HouseholdRatingSchema.parse(
      await (await asking(`/api/books/${NOVEL_ID}/rating/household`)).json(),
    );

    expect(rated.status).toBe(204);
    expect(household).toEqual({ average: 5, count: 1 });
  });
});

describe('what somebody is reading, over HTTP', () => {
  it('lists each book somebody has opened, with where they are in it', async () => {
    const asking = await asSomebody();

    await asking(`/api/books/${NOVEL_ID}/chapters/${NOVEL_CHAPTER}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ pageNumber: null, fraction: 0.3, isFinished: false }),
    });

    const readings = BookReadingListSchema.parse(
      await (await asking('/api/reading')).json(),
    ).readings;

    expect(readings.map((one) => [one.book.id, one.fraction])).toEqual([[NOVEL_ID, 0.3]]);
  });

  it('forgets one book, and then everything', async () => {
    const asking = await asSomebody();

    await asking(`/api/books/${NOVEL_ID}/chapters/${NOVEL_CHAPTER}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ pageNumber: null, fraction: 0.3, isFinished: false }),
    });
    await asking(`/api/books/${MANGA_ID}/chapters/${MANGA_CHAPTER}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ pageNumber: 4, fraction: null, isFinished: false }),
    });

    expect((await asking(`/api/books/${NOVEL_ID}/progress`, { method: 'DELETE' })).status).toBe(
      204,
    );
    expect(
      BookReadingListSchema.parse(await (await asking('/api/reading')).json()).readings.map(
        (one) => one.book.id,
      ),
    ).toEqual([MANGA_ID]);

    await asking('/api/reading', { method: 'DELETE' });

    expect(
      BookReadingListSchema.parse(await (await asking('/api/reading')).json()).readings,
    ).toEqual([]);
  });
});

const A_BOOKMARK = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0b01';

const ANOTHER_BOOKMARK = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0b02';

/**
 * Two people signed in to one server, and a way to ask it things as each of them.
 */
const twoPeople = async () => {
  const built = build();
  const cookies = [
    await signedIn(built),
    await signedIn(built, { name: 'Dan', email: 'dan@valence.local' }),
  ];

  return cookies.map(
    (cookie) =>
      (path: string, init: RequestInit = {}) =>
        built.app.request(`${BASE}${path}`, {
          ...init,
          headers: { cookie, origin: BASE, 'content-type': 'application/json' },
        }),
  );
};

/**
 * The bookmarks somebody has in a book, as the server lists them.
 */
const bookmarksIn = async (
  asking: (path: string) => Promise<Response> | Response,
  bookId: string,
) =>
  BookmarkListSchema.parse(await (await asking(`/api/books/${bookId}/bookmarks`)).json()).bookmarks;

describe('bookmarks over HTTP', () => {
  it('has none in a book nobody has marked', async () => {
    const asking = await asSomebody();

    expect(await bookmarksIn(asking, MANGA_ID)).toEqual([]);
  });

  it('keeps a page bookmark, and keeps it once however often it is sent', async () => {
    const asking = await asSomebody();
    const marking = {
      method: 'PUT',
      body: JSON.stringify({ chapterId: MANGA_CHAPTER, pageNumber: 4, fraction: null }),
    };

    const first = await asking(`/api/books/${MANGA_ID}/bookmarks/${A_BOOKMARK}`, marking);
    const again = await asking(`/api/books/${MANGA_ID}/bookmarks/${A_BOOKMARK}`, marking);

    expect([first.status, again.status]).toEqual([204, 204]);
    expect(await bookmarksIn(asking, MANGA_ID)).toEqual([
      expect.objectContaining({
        id: A_BOOKMARK,
        bookId: MANGA_ID,
        chapterId: MANGA_CHAPTER,
        pageNumber: 4,
        fraction: null,
        pageShown: null,
        excerpt: null,
        picture: null,
      }),
    ]);
  });

  it('keeps a place in the text with the words there', async () => {
    const asking = await asSomebody();

    await asking(`/api/books/${NOVEL_ID}/bookmarks/${A_BOOKMARK}`, {
      method: 'PUT',
      body: JSON.stringify({
        chapterId: NOVEL_CHAPTER,
        pageNumber: null,
        fraction: 0.4,
        pageShown: null,
        excerpt: 'It is a truth universally acknowledged',
      }),
    });

    expect(await bookmarksIn(asking, NOVEL_ID)).toEqual([
      expect.objectContaining({
        fraction: 0.4,
        pageShown: null,
        excerpt: 'It is a truth universally acknowledged',
      }),
    ]);
  });

  it('refuses a bookmark with no place in the book', async () => {
    const asking = await asSomebody();
    const refused = await asking(`/api/books/${MANGA_ID}/bookmarks/${A_BOOKMARK}`, {
      method: 'PUT',
      body: JSON.stringify({ chapterId: MANGA_CHAPTER, pageNumber: null, fraction: null }),
    });

    expect(refused.status).toBe(400);
  });

  it('refuses a bookmark in a chapter of another book', async () => {
    const asking = await asSomebody();
    const refused = await asking(`/api/books/${MANGA_ID}/bookmarks/${A_BOOKMARK}`, {
      method: 'PUT',
      body: JSON.stringify({ chapterId: NOVEL_CHAPTER, pageNumber: 1, fraction: null }),
    });

    expect(refused.status).toBe(404);
    expect(await bookmarksIn(asking, MANGA_ID)).toEqual([]);
  });

  it('removes a bookmark, and says the same of one already gone', async () => {
    const asking = await asSomebody();

    await asking(`/api/books/${MANGA_ID}/bookmarks/${A_BOOKMARK}`, {
      method: 'PUT',
      body: JSON.stringify({ chapterId: MANGA_CHAPTER, pageNumber: 4, fraction: null }),
    });

    const removed = await asking(`/api/books/${MANGA_ID}/bookmarks/${A_BOOKMARK}`, {
      method: 'DELETE',
    });
    const again = await asking(`/api/books/${MANGA_ID}/bookmarks/${ANOTHER_BOOKMARK}`, {
      method: 'DELETE',
    });

    expect([removed.status, again.status]).toEqual([204, 204]);
    expect(await bookmarksIn(asking, MANGA_ID)).toEqual([]);
  });

  it('keeps each person’s bookmarks to themselves', async () => {
    const [marques, dan] = await twoPeople();

    if (marques === undefined || dan === undefined) {
      throw new Error('Two people should have signed in.');
    }

    await marques(`/api/books/${MANGA_ID}/bookmarks/${A_BOOKMARK}`, {
      method: 'PUT',
      body: JSON.stringify({ chapterId: MANGA_CHAPTER, pageNumber: 4, fraction: null }),
    });

    const takenOver = await dan(`/api/books/${MANGA_ID}/bookmarks/${A_BOOKMARK}`, {
      method: 'PUT',
      body: JSON.stringify({ chapterId: MANGA_CHAPTER, pageNumber: 9, fraction: null }),
    });
    await dan(`/api/books/${MANGA_ID}/bookmarks/${A_BOOKMARK}`, { method: 'DELETE' });

    expect(takenOver.status).toBe(404);
    expect(await bookmarksIn(dan, MANGA_ID)).toEqual([]);
    expect((await bookmarksIn(marques, MANGA_ID)).map((one) => one.pageNumber)).toEqual([4]);
  });

  it('asks somebody to sign in first', async () => {
    const built = build();
    const listing = await built.app.request(`${BASE}/api/books/${MANGA_ID}/bookmarks`);
    const marking = await built.app.request(
      `${BASE}/api/books/${MANGA_ID}/bookmarks/${A_BOOKMARK}`,
      {
        method: 'PUT',
        headers: { origin: BASE, 'content-type': 'application/json' },
        body: JSON.stringify({ chapterId: MANGA_CHAPTER, pageNumber: 4, fraction: null }),
      },
    );

    expect([listing.status, marking.status]).toEqual([401, 401]);
  });
});

describe('sharing a book over HTTP', () => {
  it('shares a whole book by link, and hands it to whoever opens the link', async () => {
    const built = build();
    const cookie = await signedIn(built);
    const made = await built.app.request(`${BASE}/api/shares`, {
      method: 'POST',
      headers: { cookie, origin: BASE, 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'book', bookId: NOVEL_ID }),
    });
    const share = CreatedShareSchema.parse(await made.json());
    const opened = await built.app.request(`${BASE}/api/share/${share.token}`);
    const body = z
      .object({ kind: z.string(), book: BookSchema.nullable() })
      .parse(await opened.json());

    expect(made.status).toBe(201);
    expect(share.bookId).toBe(NOVEL_ID);
    expect(body.kind).toBe('book');
    expect(body.book?.title).toBe('Pride and Prejudice');
  });

  it('lets whoever holds the link read the book, and nothing else', async () => {
    const built = build();
    const cookie = await signedIn(built);
    const made = CreatedShareSchema.parse(
      await (
        await built.app.request(`${BASE}/api/shares`, {
          method: 'POST',
          headers: { cookie, origin: BASE, 'content-type': 'application/json' },
          body: JSON.stringify({ kind: 'book', bookId: NOVEL_ID }),
        })
      ).json(),
    );
    const opened = await built.app.request(`${BASE}/api/share/${made.token}`);
    const guest = opened.headers
      .getSetCookie()
      .map((one) => one.split(';')[0] ?? '')
      .join('; ');

    const reading = await built.app.request(
      `${BASE}/api/books/${NOVEL_ID}/chapters/${NOVEL_CHAPTER}/document?part=0`,
      { headers: { cookie: guest } },
    );
    const elsewhere = await built.app.request(`${BASE}/api/books/${MANGA_ID}`, {
      headers: { cookie: guest },
    });
    const keeping = await built.app.request(
      `${BASE}/api/books/${NOVEL_ID}/chapters/${NOVEL_CHAPTER}/progress`,
      {
        method: 'PUT',
        headers: { cookie: guest, 'content-type': 'application/json', origin: BASE },
        body: JSON.stringify({ pageNumber: null, fraction: 0.5, isFinished: false }),
      },
    );

    expect(reading.status).toBe(200);
    expect(elsewhere.status).toBe(403);
    expect(keeping.status).toBe(403);
  });

  it('will not share a book the sharer cannot see', async () => {
    const asking = await asSomebody({ refusesEveryAccount: true });
    const made = await asking('/api/shares', {
      method: 'POST',
      body: JSON.stringify({ kind: 'book', bookId: NOVEL_ID }),
    });

    expect(made.status).toBe(404);
  });
});
