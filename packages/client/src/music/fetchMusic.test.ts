import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  albumArtworkUrl,
  artistImageUrl,
  fetchAlbums,
  fetchArtistStory,
  fetchArtists,
  fetchPicks,
  fetchLyrics,
  fetchTracks,
  searchMusic,
  setArtistFollowed,
  trackStreamUrl,
} from './fetchMusic';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import { aTrack } from '@ValenceClient/testing/aTrack';

type Answer = { ok: boolean; status: number; json: () => Promise<JsonValue> };

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Answer>>();

const answerWith = (body: JsonValue, ok = true, status = 200) => {
  fetchMock.mockResolvedValue({ ok, status, json: () => Promise.resolve(body) });
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchMusic', () => {
  it('asks for albums newest first unless told otherwise', async () => {
    answerWith({ albums: [] });

    await fetchAlbums();

    expect(fetchMock).toHaveBeenCalledWith('/api/music/albums?order=recent', expect.anything());
  });

  it('asks for only the followed artists where told to', async () => {
    answerWith({ artists: [] });

    await fetchArtists(true);

    expect(fetchMock).toHaveBeenCalledWith('/api/music/artists?favourites=true', expect.anything());
  });

  it('asks nothing for no tracks', async () => {
    await expect(fetchTracks([])).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('asks for tracks by id in one request', async () => {
    answerWith({ tracks: [] });

    await fetchTracks(['a', 'b']);

    expect(fetchMock).toHaveBeenCalledWith('/api/music/tracks?ids=a,b', expect.anything());
  });

  it('asks for a long list of tracks a group at a time, keeping the order asked for', async () => {
    const idOf = (at: number) => `00000000-0000-4000-8000-${at.toString().padStart(12, '0')}`;
    const ids = Array.from({ length: 160 }, (_, at) => idOf(at));

    fetchMock.mockImplementation((input) => {
      const asked =
        new URL(input, 'http://valence.local').searchParams.get('ids')?.split(',') ?? [];

      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            tracks: [asked[0] ?? '', asked.at(-1) ?? ''].map((id) => aTrack(0, { id })),
          }),
      });
    });

    const tracks = await fetchTracks(ids);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(tracks.map((track) => track.id)).toEqual([0, 149, 150, 159].map(idOf));
  });

  it('escapes what was typed into a search', async () => {
    answerWith({ tracks: [], albums: [], artists: [], playlists: [] });

    await searchMusic('AC/DC & co');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/music/search?q=AC%2FDC%20%26%20co',
      expect.anything(),
    );
  });

  it('reads no lyrics, rather than failing, for a track that has none', async () => {
    answerWith({ error: 'No lyrics for that track.' }, false, 404);

    await expect(fetchLyrics('t')).resolves.toBeNull();
  });

  it('still fails on a refusal that is not about lyrics being missing', async () => {
    answerWith({ error: 'You’re not signed in.' }, false, 401);

    await expect(fetchLyrics('t')).rejects.toThrow();
  });

  it('follows an artist with a put and stops with a delete', async () => {
    answerWith({ isFavourite: true });

    await expect(setArtistFollowed('x', true)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/music/artists/x/favourite',
      expect.objectContaining({ method: 'PUT' }),
    );

    await setArtistFollowed('x', false);
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/music/artists/x/favourite',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('says a follow did not take where the server could not be reached', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(setArtistFollowed('x', true)).resolves.toBe(false);
  });

  it('builds the addresses audio and pictures are read from', () => {
    expect(trackStreamUrl('t', 'low')).toBe('/api/music/tracks/t/stream?quality=low');
    expect(albumArtworkUrl('a')).toBe('/api/music/albums/a/artwork');
    expect(artistImageUrl('b')).toBe('/api/music/artists/b/image');
  });

  it('asks nothing for picks to go with no songs', async () => {
    await expect(fetchPicks([])).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('asks for songs to mix in beside the ones queued', async () => {
    answerWith({ tracks: [] });

    await expect(fetchPicks(['a', 'b'])).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/music/picks',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ trackIds: ['a', 'b'] }) }),
    );
  });

  it('mixes nothing in where the picks cannot be had or read', async () => {
    answerWith({}, false, 500);

    await expect(fetchPicks(['a'])).resolves.toEqual([]);

    answerWith({ nothing: true });

    await expect(fetchPicks(['a'])).resolves.toEqual([]);

    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(fetchPicks(['a'])).resolves.toEqual([]);
  });

  it("reads an artist's story", async () => {
    answerWith({ bio: 'A band.', sourceUrl: null, missing: [] });

    await expect(fetchArtistStory('ar')).resolves.toEqual({
      bio: 'A band.',
      sourceUrl: null,
      missing: [],
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/music/artists/ar/story', expect.anything());
  });
});
