import { describe, expect, it, vi } from 'vitest';
import { enrichMusicLibrary } from './enrichMusicLibrary';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { EnrichingStore } from './EnrichingStore';
import type { MusicWeb } from './createMusicWeb';

const COVER = new Uint8Array([1]);

const done = (): Promise<void> => Promise.resolve();

const aStore = (overrides: Partial<EnrichingStore> = {}) => {
  const store = {
    albumsToLookUp: vi.fn<EnrichingStore['albumsToLookUp']>(() => Promise.resolve([])),
    markAlbumLookedUp: vi.fn<EnrichingStore['markAlbumLookedUp']>(done),
    artistsToLookUp: vi.fn<EnrichingStore['artistsToLookUp']>(() => Promise.resolve([])),
    markArtistLookedUp: vi.fn<EnrichingStore['markArtistLookedUp']>(done),
    songsBy: vi.fn<EnrichingStore['songsBy']>(() => Promise.resolve([])),
    setVideo: vi.fn<EnrichingStore['setVideo']>(done),
    songsWithoutLyrics: vi.fn<EnrichingStore['songsWithoutLyrics']>(() => Promise.resolve([])),
    keepFoundLyrics: vi.fn<EnrichingStore['keepFoundLyrics']>(done),
    setAlbumArtwork: vi.fn<EnrichingStore['setAlbumArtwork']>(done),
    setArtistImage: vi.fn<EnrichingStore['setArtistImage']>(done),
  };

  return { ...store, ...overrides } satisfies EnrichingStore;
};

const aWeb = (json: (url: string) => JsonValue | null): MusicWeb => ({
  json: vi.fn((url: string) => Promise.resolve(json(url))),
  bytes: vi.fn((): Promise<Uint8Array | null> => Promise.resolve(COVER)),
});

const artwork = {
  keep: vi.fn((kind: string, id: string) => Promise.resolve(`/art/${kind}-${id}.webp`)),
};

const SLEEP_TOKEN = {
  artists: [{ idArtist: '9', strArtist: 'Sleep Token', strArtistThumb: 'https://img/x.jpg' }],
};

describe('enrichMusicLibrary', () => {
  it('gives an album without a cover the one it is tagged with, and remembers it asked', async () => {
    const store = aStore({
      albumsToLookUp: vi.fn(() =>
        Promise.resolve([
          { id: 'a1', title: 'Arcadia', artistName: 'Sleep Token', musicbrainzId: 'r1' },
        ]),
      ),
    });

    const found = await enrichMusicLibrary({
      libraryId: 'l1',
      store,
      web: aWeb(() => null),
      artwork,
      audioDbKey: '123',
    });

    expect(store.setAlbumArtwork).toHaveBeenCalledWith('a1', '/art/album-a1.webp');
    expect(store.markAlbumLookedUp).toHaveBeenCalledWith('a1');
    expect(found.covers).toBe(1);
  });

  it('gives an artist a photograph and matches their videos to their songs', async () => {
    const store = aStore({
      artistsToLookUp: vi.fn(() =>
        Promise.resolve([{ id: 'r1', name: 'Sleep Token', hasImage: false }]),
      ),
      songsBy: vi.fn(() =>
        Promise.resolve([
          { id: 't1', title: 'Caramel' },
          { id: 't2', title: 'Emergence' },
        ]),
      ),
    });

    const found = await enrichMusicLibrary({
      libraryId: 'l1',
      store,
      web: aWeb((url) =>
        url.includes('search.php')
          ? SLEEP_TOKEN
          : url.includes('mvid.php')
            ? {
                mvids: [
                  {
                    strTrack: 'Caramel (Official Video)',
                    strMusicVid: 'https://youtu.be/abcdefghijk',
                  },
                ],
              }
            : null,
      ),
      artwork,
      audioDbKey: '123',
    });

    expect(store.setArtistImage).toHaveBeenCalledWith('r1', '/art/artist-r1.webp');
    expect(store.setVideo).toHaveBeenCalledWith('t1', 'abcdefghijk');
    expect(store.setVideo).toHaveBeenCalledTimes(1);
    expect(found).toMatchObject({ pictures: 1, videos: 1 });
  });

  it('keeps the photograph an artist already has', async () => {
    const store = aStore({
      artistsToLookUp: vi.fn(() =>
        Promise.resolve([{ id: 'r1', name: 'Sleep Token', hasImage: true }]),
      ),
    });

    await enrichMusicLibrary({
      libraryId: 'l1',
      store,
      web: aWeb((url) => (url.includes('search.php') ? SLEEP_TOKEN : null)),
      artwork,
      audioDbKey: '123',
    });

    expect(store.setArtistImage).not.toHaveBeenCalled();
    expect(store.markArtistLookedUp).toHaveBeenCalledWith('r1');
  });

  it('keeps the words found for a song, and remembers a song it found none for', async () => {
    const store = aStore({
      songsWithoutLyrics: vi.fn(() =>
        Promise.resolve([
          {
            id: 't1',
            title: 'Caramel',
            artistName: 'Sleep Token',
            albumTitle: 'Arcadia',
            durationSeconds: 290,
          },
          { id: 't2', title: 'Unknown', artistName: 'x', albumTitle: 'y', durationSeconds: 10 },
        ]),
      ),
    });

    const found = await enrichMusicLibrary({
      libraryId: 'l1',
      store,
      web: aWeb((url) =>
        url.includes('Caramel') ? { syncedLyrics: '[00:01.00]Hi', plainLyrics: null } : null,
      ),
      artwork,
      audioDbKey: '123',
    });

    expect(store.keepFoundLyrics).toHaveBeenCalledWith('t1', '[00:01.00]Hi');
    expect(store.keepFoundLyrics).toHaveBeenCalledWith('t2', null);
    expect(found.lyrics).toBe(1);
  });

  it('stops when the job is cancelled', async () => {
    const store = aStore({
      albumsToLookUp: vi.fn(() =>
        Promise.resolve([{ id: 'a1', title: 'x', artistName: 'y', musicbrainzId: null }]),
      ),
    });

    await enrichMusicLibrary({
      libraryId: 'l1',
      store,
      web: aWeb(() => null),
      artwork,
      audioDbKey: '123',
      isCancelled: () => true,
    });

    expect(store.markAlbumLookedUp).not.toHaveBeenCalled();
  });

  it('asks again about what was not found before when told to', async () => {
    const store = aStore();

    await enrichMusicLibrary({
      libraryId: 'l1',
      store,
      web: aWeb(() => null),
      artwork,
      audioDbKey: '123',
      isAgain: true,
    });

    expect(store.albumsToLookUp).toHaveBeenCalledWith('l1', true);
    expect(store.songsWithoutLyrics).toHaveBeenCalledWith('l1', true);
  });
});
