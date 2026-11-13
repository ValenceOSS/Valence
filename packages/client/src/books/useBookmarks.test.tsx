import { act, waitFor } from '@testing-library/react';
import { onlineManager } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { tidyAfterATest } from '@ValenceClient/testing/tidyAfterATest';
import { readKeptBookmarks } from './readKeptBookmarks';
import { useBookmarks } from './useBookmarks';
import { SaveBookmarkSchema } from '@ValenceContracts/schemas/Book';
import type { Bookmark } from '@ValenceContracts/schemas/Book';

const serverHas = vi.hoisted(() => ({ useServerHas: vi.fn<() => boolean | null>() }));

vi.mock('@ValenceClient/about/useServerHas', () => serverHas);

const BOOK = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0001';

const ONE = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0002';

const TWO = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0003';

const GONE = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0004';

const CHAPTERS = [ONE, TWO];

const MARK = {
  a: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0b0a',
  b: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0b0b',
  c: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0b0c',
  d: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0b0d',
  known: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0b01',
  first: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0b02',
  second: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0b03',
};

const held = new Map<string, string>();

const asked: string[] = [];

let onServer: Bookmark[] = [];

let answerOf: (method: string, path: string) => Promise<Response> | null = () => null;

/**
 * A bookmark on the server, in the first chapter unless said otherwise.
 */
const aBookmark = (id: string, place: Partial<Bookmark> = {}): Bookmark => ({
  id,
  bookId: BOOK,
  chapterId: ONE,
  pageNumber: 1,
  fraction: null,
  pageShown: null,
  excerpt: null,
  picture: null,
  createdAt: '2026-11-11T00:00:00.000Z',
  ...place,
});

/**
 * The server's bookmarks, answering a list, a mark and a removal the way the real one does.
 */
const theServer = (input: string, init: RequestInit = {}): Promise<Response> => {
  const method = init.method ?? 'GET';
  const path = input;

  asked.push(`${method} ${path}`);

  const answer = answerOf(method, path);

  if (answer !== null) {
    return answer;
  }

  if (method === 'GET') {
    return Promise.resolve(new Response(JSON.stringify({ bookmarks: onServer }), { status: 200 }));
  }

  const id = path.split('/').at(-1) ?? '';

  if (method === 'DELETE') {
    onServer = onServer.filter((one) => one.id !== id);
  } else if (!onServer.some((one) => one.id === id)) {
    const body = SaveBookmarkSchema.parse(
      JSON.parse(typeof init.body === 'string' ? init.body : '{}'),
    );

    onServer = [...onServer, aBookmark(id, body)];
  }

  return Promise.resolve(new Response(null, { status: 204 }));
};

/**
 * The changes this device still holds for the book.
 */
const waiting = () => readKeptBookmarks(BOOK).waiting;

/**
 * Every mark and removal sent to the server, leaving out the lists asked for.
 */
const sent = () => asked.filter((one) => !one.startsWith('GET'));

beforeEach(() => {
  held.clear();
  asked.length = 0;
  onServer = [];
  answerOf = () => null;
  serverHas.useServerHas.mockReturnValue(true);
  vi.stubGlobal('fetch', vi.fn(theServer));
  installPlatform(
    aFakePlatform({
      store: {
        read: (key) => held.get(key) ?? null,
        write: (key, value) => {
          held.set(key, value);
        },
        forget: (key) => {
          held.delete(key);
        },
      },
    }),
  );
});

afterEach(async () => {
  await tidyAfterATest();
  forgetPlatform();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  onlineManager.setOnline(true);
});

describe('useBookmarks', () => {
  it('shows a bookmark at once, keeps it on the device, and sends it', async () => {
    const { result } = renderHookInACache(() => useBookmarks(BOOK, CHAPTERS));

    await waitFor(() => {
      expect(asked).toContain(`GET /api/books/${BOOK}/bookmarks`);
    });

    act(() => {
      result.current.add({
        chapterId: ONE,
        pageNumber: 4,
        fraction: null,
        pageShown: null,
        excerpt: null,
        picture: null,
      });
    });

    expect(result.current.bookmarks.map((one) => one.pageNumber)).toEqual([4]);
    expect(held.has(`valence.books.bookmarks.${BOOK}`)).toBe(true);

    await waitFor(() => {
      expect(onServer.map((one) => one.pageNumber)).toEqual([4]);
    });
    await waitFor(() => {
      expect(waiting()).toEqual([]);
    });
    expect(readKeptBookmarks(BOOK).known.map((one) => one.pageNumber)).toEqual([4]);
    expect(result.current.bookmarks.map((one) => one.pageNumber)).toEqual([4]);
  });

  it('shows the server’s bookmarks, in the order they come in the book', async () => {
    onServer = [
      aBookmark(MARK.b, { chapterId: TWO, pageNumber: 1 }),
      aBookmark(MARK.a, { chapterId: ONE, pageNumber: 9 }),
      aBookmark(MARK.c, { chapterId: ONE, pageNumber: 2 }),
      aBookmark(MARK.d, { chapterId: GONE, pageNumber: 0 }),
    ];

    const { result } = renderHookInACache(() => useBookmarks(BOOK, CHAPTERS));

    await waitFor(() => {
      expect(result.current.bookmarks.map((one) => one.id)).toEqual([MARK.c, MARK.a, MARK.b]);
    });
  });

  it('sends what waits on the device in the order it was made', async () => {
    onServer = [aBookmark(MARK.known)];
    held.set(
      `valence.books.bookmarks.${BOOK}`,
      JSON.stringify({
        known: [aBookmark(MARK.known)],
        waiting: [
          { kind: 'add', bookmark: aBookmark(MARK.first, { pageNumber: 5 }) },
          { kind: 'add', bookmark: aBookmark(MARK.second, { pageNumber: 6 }) },
          { kind: 'remove', bookmarkId: MARK.known },
        ],
      }),
    );

    const { result } = renderHookInACache(() => useBookmarks(BOOK, CHAPTERS));

    expect(result.current.bookmarks.map((one) => one.id)).toEqual([MARK.first, MARK.second]);

    await waitFor(() => {
      expect(sent()).toEqual([
        `PUT /api/books/${BOOK}/bookmarks/${MARK.first}`,
        `PUT /api/books/${BOOK}/bookmarks/${MARK.second}`,
        `DELETE /api/books/${BOOK}/bookmarks/${MARK.known}`,
      ]);
    });
    await waitFor(() => {
      expect(waiting()).toEqual([]);
    });
    expect(onServer.map((one) => one.id)).toEqual([MARK.first, MARK.second]);
    expect(result.current.bookmarks.map((one) => one.id)).toEqual([MARK.first, MARK.second]);
  });

  it('keeps a bookmark waiting while the server cannot be reached, and sends it once it can', async () => {
    let isDown = true;

    answerOf = (method) =>
      method === 'PUT' && isDown ? Promise.reject(new TypeError('offline')) : null;

    const { result } = renderHookInACache(() => useBookmarks(BOOK, CHAPTERS));

    await waitFor(() => {
      expect(asked).toContain(`GET /api/books/${BOOK}/bookmarks`);
    });

    act(() => {
      result.current.add({
        chapterId: ONE,
        pageNumber: 4,
        fraction: null,
        pageShown: null,
        excerpt: null,
        picture: null,
      });
    });

    await waitFor(() => {
      expect(sent()).toHaveLength(1);
    });
    expect(waiting()).toHaveLength(1);
    expect(result.current.bookmarks.map((one) => one.pageNumber)).toEqual([4]);

    isDown = false;

    act(() => {
      onlineManager.setOnline(false);
      onlineManager.setOnline(true);
    });

    await waitFor(() => {
      expect(onServer.map((one) => one.pageNumber)).toEqual([4]);
    });
    await waitFor(() => {
      expect(waiting()).toEqual([]);
    });
  });

  it('tries again every so often while anything waits', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    let isDown = true;

    answerOf = (method) =>
      method === 'PUT' && isDown ? Promise.resolve(new Response('{}', { status: 503 })) : null;

    const { result } = renderHookInACache(() => useBookmarks(BOOK, CHAPTERS));

    await waitFor(() => {
      expect(asked).toContain(`GET /api/books/${BOOK}/bookmarks`);
    });

    act(() => {
      result.current.add({
        chapterId: ONE,
        pageNumber: 4,
        fraction: null,
        pageShown: null,
        excerpt: null,
        picture: null,
      });
    });

    await waitFor(() => {
      expect(sent()).toHaveLength(1);
    });

    isDown = false;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    await waitFor(() => {
      expect(onServer.map((one) => one.pageNumber)).toEqual([4]);
    });
  });

  it('drops a bookmark the server refuses, rather than sending it for ever', async () => {
    answerOf = (method) =>
      method === 'PUT' ? Promise.resolve(new Response('{}', { status: 404 })) : null;

    const { result } = renderHookInACache(() => useBookmarks(BOOK, CHAPTERS));

    await waitFor(() => {
      expect(asked).toContain(`GET /api/books/${BOOK}/bookmarks`);
    });

    act(() => {
      result.current.add({
        chapterId: ONE,
        pageNumber: 4,
        fraction: null,
        pageShown: null,
        excerpt: null,
        picture: null,
      });
    });

    await waitFor(() => {
      expect(waiting()).toEqual([]);
    });
    expect(result.current.bookmarks).toEqual([]);
    expect(sent()).toHaveLength(1);
  });

  it('takes back a bookmark not yet sent without asking the server anything', () => {
    serverHas.useServerHas.mockReturnValue(null);

    const { result } = renderHookInACache(() => useBookmarks(BOOK, CHAPTERS));

    act(() => {
      result.current.add({
        chapterId: ONE,
        pageNumber: 4,
        fraction: null,
        pageShown: null,
        excerpt: null,
        picture: null,
      });
    });

    const [made] = result.current.bookmarks;

    act(() => {
      result.current.remove([made?.id ?? '']);
    });

    expect(result.current.bookmarks).toEqual([]);
    expect(waiting()).toEqual([]);
    expect(asked).toEqual([]);
  });

  it('removes a bookmark taken back while it was being sent', async () => {
    let arrive: () => void = () => undefined;

    answerOf = (method, path) =>
      method === 'PUT'
        ? new Promise((resolve) => {
            arrive = () => {
              onServer = [...onServer, aBookmark(path.split('/').at(-1) ?? '')];
              resolve(new Response(null, { status: 204 }));
            };
          })
        : null;

    const { result } = renderHookInACache(() => useBookmarks(BOOK, CHAPTERS));

    await waitFor(() => {
      expect(asked).toContain(`GET /api/books/${BOOK}/bookmarks`);
    });

    act(() => {
      result.current.add({
        chapterId: ONE,
        pageNumber: 4,
        fraction: null,
        pageShown: null,
        excerpt: null,
        picture: null,
      });
    });

    await waitFor(() => {
      expect(sent()).toHaveLength(1);
    });

    const [made] = result.current.bookmarks;

    act(() => {
      result.current.remove([made?.id ?? '']);
    });

    expect(result.current.bookmarks).toEqual([]);

    await act(async () => {
      arrive();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(sent()).toEqual([
        `PUT /api/books/${BOOK}/bookmarks/${made?.id ?? ''}`,
        `DELETE /api/books/${BOOK}/bookmarks/${made?.id ?? ''}`,
      ]);
    });
    await waitFor(() => {
      expect(waiting()).toEqual([]);
    });
    expect(onServer).toEqual([]);
    expect(result.current.bookmarks).toEqual([]);
  });

  it('keeps bookmarks on the device alone where the server is too old to keep them', async () => {
    serverHas.useServerHas.mockReturnValue(false);

    const { result } = renderHookInACache(() => useBookmarks(BOOK, CHAPTERS));

    act(() => {
      result.current.add({
        chapterId: TWO,
        pageNumber: null,
        fraction: 0.5,
        pageShown: null,
        excerpt: 'Words.',
        picture: null,
      });
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(asked).toEqual([]);
    expect(result.current.bookmarks.map((one) => one.fraction)).toEqual([0.5]);
    expect(waiting()).toHaveLength(1);
  });

  it('sends nothing while the device has been put offline', async () => {
    held.set('valence.offline.chosen', 'yes');

    const { result } = renderHookInACache(() => useBookmarks(BOOK, CHAPTERS));

    act(() => {
      result.current.add({
        chapterId: ONE,
        pageNumber: 4,
        fraction: null,
        pageShown: null,
        excerpt: null,
        picture: null,
      });
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(sent()).toEqual([]);
    expect(result.current.bookmarks.map((one) => one.pageNumber)).toEqual([4]);
  });

  it('carries over the bookmarks the phone kept the old way, once', async () => {
    held.set(`valence.reader.bookmarks.${BOOK}.${ONE}`, JSON.stringify([7]));

    const { result, rerender } = renderHookInACache(() => useBookmarks(BOOK, CHAPTERS));

    await waitFor(() => {
      expect(onServer.map((one) => one.pageNumber)).toEqual([7]);
    });

    rerender();

    expect(held.has(`valence.reader.bookmarks.${BOOK}.${ONE}`)).toBe(false);
    expect(result.current.bookmarks.map((one) => one.pageNumber)).toEqual([7]);
    expect(sent()).toHaveLength(1);
  });
});
