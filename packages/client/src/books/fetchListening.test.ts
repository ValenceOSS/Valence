import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bookAudioUrl,
  fetchListening,
  fetchListeningProgress,
  forgetListening,
  saveListeningProgress,
} from '@ValenceClient/books/fetchListening';

const fetchMock = vi.fn<(input: string, options?: RequestInit) => Promise<Response>>();

const BOOK_ID = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0001';

const TRACK_ID = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0002';

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 204 }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('bookAudioUrl', () => {
  it('names a track to listen to', () => {
    expect(bookAudioUrl('a-book', 'a-track')).toBe('/api/books/a-book/chapters/a-track/audio');
  });
});

describe('saveListeningProgress', () => {
  it('says where somebody has got to in a book', async () => {
    expect(
      await saveListeningProgress(BOOK_ID, {
        chapterId: TRACK_ID,
        positionSeconds: 42.5,
        isFinished: false,
      }),
    ).toBe(true);

    const [url, options] = fetchMock.mock.calls[0] ?? [];

    expect(url).toBe(`/api/books/${BOOK_ID}/listening`);
    expect(options?.method).toBe('PUT');
    expect(JSON.parse(typeof options?.body === 'string' ? options.body : '{}')).toEqual({
      chapterId: TRACK_ID,
      positionSeconds: 42.5,
      isFinished: false,
    });
  });

  it('says so when it could not be kept', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    expect(
      await saveListeningProgress(BOOK_ID, {
        chapterId: TRACK_ID,
        positionSeconds: 1,
        isFinished: false,
      }),
    ).toBe(false);
  });
});

describe('fetchListeningProgress', () => {
  it('reads where somebody has got to, or nothing', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ progress: null }), { status: 200 }));

    expect(await fetchListeningProgress(BOOK_ID)).toBeNull();
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`/api/books/${BOOK_ID}/listening`);
  });
});

describe('fetchListening', () => {
  it('reads what somebody is partway through', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ listenings: [] }), { status: 200 }));

    expect(await fetchListening()).toEqual([]);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/listening');
  });
});

describe('forgetListening', () => {
  it('forgets where somebody had got to', async () => {
    expect(await forgetListening(BOOK_ID)).toBe(true);
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('DELETE');
  });
});
