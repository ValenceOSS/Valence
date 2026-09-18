import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchFavourites, fetchKeptBooks, setBookFavourite, setFavourite } from './fetchFavourites';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import { writeCurrentProfile } from '@ValenceClient/profiles/currentProfile';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';

type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<{ ok: boolean; status: number; json: () => Promise<JsonValue> }>;

const fetchMock = vi.fn<FetchLike>();

const ok = (body: JsonValue) => ({ ok: true, status: 200, json: () => Promise.resolve(body) });

const kept = {
  favourites: [
    { mediaId: '9c858901-8a57-4791-81fe-4c455b099bc9', keptAt: '2026-08-10T00:00:00.000Z' },
  ],
};

beforeEach(() => {
  installPlatform(aFakePlatform());
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  forgetPlatform();
  vi.unstubAllGlobals();
});

describe('fetchFavourites', () => {
  it('answers with what this viewer has kept', async () => {
    fetchMock.mockResolvedValue(ok(kept));

    await expect(fetchFavourites()).resolves.toEqual(['9c858901-8a57-4791-81fe-4c455b099bc9']);
  });

  it('says so when the server refuses, rather than answering with nothing', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve(null) });

    await expect(fetchFavourites()).rejects.toThrow();
  });

  it('says so when the answer is not the shape it was promised', async () => {
    fetchMock.mockResolvedValue(ok({ favourites: [{ mediaId: 'not an identifier' }] }));

    await expect(fetchFavourites()).rejects.toThrow();
  });

  it('says so when the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(fetchFavourites()).rejects.toThrow();
  });
});

describe('setFavourite', () => {
  it('keeps something by putting it', async () => {
    fetchMock.mockResolvedValue(ok(null));

    await expect(setFavourite('media-1', true)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/media/media-1/favourite',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('stops keeping something by deleting it', async () => {
    fetchMock.mockResolvedValue(ok(null));

    await setFavourite('media-1', false);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/media/media-1/favourite',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('says so when the server did not agree', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404, json: () => Promise.resolve(null) });

    await expect(setFavourite('media-1', true)).resolves.toBe(false);
  });

  it('says so when the request never arrived', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(setFavourite('media-1', true)).resolves.toBe(false);
  });
});

describe('which face is asking', () => {
  it('says so when reading, so a household does not share one set of hearts', async () => {
    writeCurrentProfile('kid');
    fetchMock.mockResolvedValue(ok(kept));

    await fetchFavourites();

    expect(fetchMock.mock.calls.at(-1)?.[1]?.headers).toMatchObject({
      'x-valence-profile': 'kid',
    });
  });

  it('says so when keeping something, so it lands against the right person', async () => {
    writeCurrentProfile('kid');
    fetchMock.mockResolvedValue(ok(null));

    await setFavourite('9c858901-8a57-4791-81fe-4c455b099bc9', true);

    expect(fetchMock.mock.calls.at(-1)?.[1]?.headers).toMatchObject({
      'x-valence-profile': 'kid',
    });
  });

  it('leaves the header off where nobody has been picked, so the server chooses', async () => {
    fetchMock.mockResolvedValue(ok(kept));

    await fetchFavourites();

    expect(fetchMock.mock.calls.at(-1)?.[1]?.headers).not.toHaveProperty('x-valence-profile');
  });
});

describe('fetchKeptBooks', () => {
  it('answers with the books this viewer has kept', async () => {
    fetchMock.mockResolvedValue(
      ok({
        ...kept,
        books: [
          { bookId: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0001', keptAt: '2026-08-10T00:00:00.000Z' },
        ],
      }),
    );

    await expect(fetchKeptBooks()).resolves.toEqual(['6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0001']);
  });

  it('answers with none from a server that keeps no books', async () => {
    fetchMock.mockResolvedValue(ok(kept));

    await expect(fetchKeptBooks()).resolves.toEqual([]);
  });
});

describe('setBookFavourite', () => {
  it('keeps a book at the book’s own address', async () => {
    fetchMock.mockResolvedValue(ok(null));

    await expect(setBookFavourite('book-1', true)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/books/book-1/favourite',
      expect.objectContaining({ method: 'PUT' }),
    );
  });
});
