import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  correctAlbum,
  correctBook,
  forgetAlbumCorrection,
  forgetBookCorrection,
  searchAlbumMatches,
  searchBookMatches,
} from './fetchCorrections';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Answer = { ok: boolean; status: number; json: () => Promise<JsonValue> };

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Answer>>();

const answerWith = (body: JsonValue, ok = true) => {
  fetchMock.mockResolvedValue({ ok, status: ok ? 200 : 400, json: () => Promise.resolve(body) });
};

const BOOK = {
  openLibraryId: 123,
  title: 'Red Rising',
  author: 'Pierce Brown',
  year: 2014,
  coverUrl: null,
};

const ALBUM = {
  kind: 'album',
  musicBrainzId: '00000000-0000-4000-8000-00000000abcd',
  title: 'The Black Parade',
  artist: 'My Chemical Romance',
  disambiguation: null,
  type: 'album',
  year: 2006,
  coverUrl: null,
} as const;

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchCorrections', () => {
  it('searches for what a book really is', async () => {
    answerWith({ matches: [BOOK] });

    await expect(searchBookMatches('red rising')).resolves.toEqual([BOOK]);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/books/matches?q=red+rising');
  });

  it('finds no book where the answer cannot be read', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(searchBookMatches('red rising')).resolves.toEqual([]);
  });

  it('searches for what an album really is', async () => {
    answerWith({ matches: [ALBUM] });

    await expect(searchAlbumMatches('black parade')).resolves.toEqual([ALBUM]);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/music/albums/matches?q=black+parade');
  });

  it('finds no album where the answer is not a list of them', async () => {
    answerWith({ nothing: true });

    await expect(searchAlbumMatches('black parade')).resolves.toEqual([]);
  });

  it('corrects a book and says nothing went wrong', async () => {
    answerWith({});

    await expect(correctBook('b1', 123)).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/books/b1/match',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ openLibraryId: 123 }) }),
    );
  });

  it('corrects an album by its release group', async () => {
    answerWith({});

    await expect(correctAlbum('a1', ALBUM)).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/music/albums/a1/match',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          releaseGroupId: ALBUM.musicBrainzId,
          title: ALBUM.title,
          artist: ALBUM.artist,
        }),
      }),
    );
  });

  it('forgets a correction', async () => {
    answerWith({});

    await expect(forgetBookCorrection('b1')).resolves.toBeNull();
    await expect(forgetAlbumCorrection('a1')).resolves.toBeNull();
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/admin/music/albums/a1/match',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it("passes on the server's reason for refusing", async () => {
    answerWith({ error: 'That book is not in the library.' }, false);

    await expect(correctBook('b1', 123)).resolves.toBe('That book is not in the library.');
  });

  it('says it could not be changed where the refusal cannot be read', async () => {
    answerWith('no', false);

    await expect(forgetBookCorrection('b1')).resolves.toBe('Couldn’t save the change. Try again.');
  });

  it('says the server could not be reached', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(correctBook('b1', 123)).resolves.toBe('Couldn’t reach the server.');
  });
});
