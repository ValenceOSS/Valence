import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchBookmarks, forgetBookmark, saveBookmark } from './fetchBookmarks';
import type { Bookmark } from '@ValenceContracts/schemas/Book';

const fetchMock = vi.fn<(input: string, options?: RequestInit) => Promise<Response>>();

const BOOK_ID = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0001';

const A_BOOKMARK: Bookmark = {
  id: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0b01',
  bookId: BOOK_ID,
  chapterId: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0002',
  pageNumber: null,
  fraction: 0.4,
  pageShown: null,
  excerpt: 'It is a truth universally acknowledged',
  picture: null,
  createdAt: '2026-11-11T00:00:00.000Z',
};

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 204 }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchBookmarks', () => {
  it('reads a book’s bookmarks', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ bookmarks: [A_BOOKMARK] }), { status: 200 }),
    );

    expect(await fetchBookmarks(BOOK_ID)).toEqual([A_BOOKMARK]);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`/api/books/${BOOK_ID}/bookmarks`);
  });

  it('fails where the server says no', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 500 }));

    await expect(fetchBookmarks(BOOK_ID)).rejects.toThrow();
  });
});

describe('saveBookmark', () => {
  it('sends the place and what shows there, under the bookmark’s own id', async () => {
    expect(await saveBookmark(A_BOOKMARK)).toBe('done');

    const [url, options] = fetchMock.mock.calls[0] ?? [];

    expect(url).toBe(`/api/books/${BOOK_ID}/bookmarks/${A_BOOKMARK.id}`);
    expect(options?.method).toBe('PUT');
    expect(JSON.parse(typeof options?.body === 'string' ? options.body : '{}')).toEqual({
      chapterId: A_BOOKMARK.chapterId,
      pageNumber: null,
      fraction: 0.4,
      pageShown: null,
      excerpt: 'It is a truth universally acknowledged',
      picture: null,
    });
  });

  it('says a refusal is one, so it is not sent again', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 404 }));

    expect(await saveBookmark(A_BOOKMARK)).toBe('refused');
  });

  it('says a server that could not be reached, failed or wanted a sign-in was not heard', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    expect(await saveBookmark(A_BOOKMARK)).toBe('unreachable');

    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 503 }));
    expect(await saveBookmark(A_BOOKMARK)).toBe('unreachable');

    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 401 }));
    expect(await saveBookmark(A_BOOKMARK)).toBe('unreachable');
  });
});

describe('forgetBookmark', () => {
  it('removes a bookmark by its id', async () => {
    expect(await forgetBookmark(BOOK_ID, A_BOOKMARK.id)).toBe('done');

    const [url, options] = fetchMock.mock.calls[0] ?? [];

    expect(url).toBe(`/api/books/${BOOK_ID}/bookmarks/${A_BOOKMARK.id}`);
    expect(options?.method).toBe('DELETE');
  });

  it('says it was not heard where the server could not be reached', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));

    expect(await forgetBookmark(BOOK_ID, A_BOOKMARK.id)).toBe('unreachable');
  });
});
