import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { musicQueries } from './musicQueries';

const music = vi.hoisted(() => ({
  fetchAlbum: vi.fn(),
  fetchAlbums: vi.fn(),
  fetchArtist: vi.fn(),
  fetchArtistStory: vi.fn(),
  fetchArtists: vi.fn(),
  fetchLiked: vi.fn(),
  fetchLyrics: vi.fn(),
  fetchTracks: vi.fn(),
  searchMusic: vi.fn(),
}));

const playlists = vi.hoisted(() => ({ fetchPlaylist: vi.fn(), fetchPlaylists: vi.fn() }));
const devices = vi.hoisted(() => ({ fetchMusicDevices: vi.fn() }));

vi.mock('@ValenceClient/music/fetchMusic', () => music);
vi.mock('@ValenceClient/music/fetchPlaylists', () => playlists);
vi.mock('@ValenceClient/music/musicDevices', () => devices);

describe('musicQueries', () => {
  it('keeps every music query under one key, so a scan can refresh them all', () => {
    const keys = [
      musicQueries.albums().queryKey,
      musicQueries.artists().queryKey,
      musicQueries.album('a').queryKey,
      musicQueries.artist('b').queryKey,
      musicQueries.liked().queryKey,
      musicQueries.lyrics('t').queryKey,
      musicQueries.playlists().queryKey,
      musicQueries.playlist('p').queryKey,
      musicQueries.devices().queryKey,
      musicQueries.artistStory('b').queryKey,
    ];

    for (const key of keys) {
      expect(key[0]).toBe('music');
    }
  });

  it('keeps playlists under their own key, so changing one refreshes every list of them', () => {
    expect(musicQueries.playlist('p').queryKey.slice(0, 2)).toEqual([...musicQueries.playlistsKey]);
    expect(musicQueries.playlists().queryKey.slice(0, 2)).toEqual([...musicQueries.playlistsKey]);
  });

  it('tells the followed artists apart from all of them', () => {
    expect(musicQueries.artists(true).queryKey).not.toEqual(musicQueries.artists(false).queryKey);
  });

  it('does not search for nothing', () => {
    expect(musicQueries.search('  ').enabled).toBe(false);
    expect(musicQueries.search('caramel').enabled).toBe(true);
  });

  it("keeps an artist's story apart from the artist, and for an hour", () => {
    expect(musicQueries.artistStory('b').queryKey).not.toEqual(musicQueries.artist('b').queryKey);
    expect(musicQueries.artistStory('b').staleTime).toBe(60 * 60 * 1000);
  });
});

describe('musicQueries, asked', () => {
  it('asks the reader each query names, with what it was given', async () => {
    const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    for (const reader of [
      ...Object.values(music),
      ...Object.values(playlists),
      ...Object.values(devices),
    ]) {
      reader.mockResolvedValue('read');
    }

    await cache.fetchQuery(musicQueries.albums());
    await cache.fetchQuery(musicQueries.artists(true));
    await cache.fetchQuery(musicQueries.album('a'));
    await cache.fetchQuery(musicQueries.artist('b'));
    await cache.fetchQuery(musicQueries.artistStory('b'));
    await cache.fetchQuery(musicQueries.tracks(['t1', 't2']));
    await cache.fetchQuery(musicQueries.liked());
    await cache.fetchQuery(musicQueries.search('blue'));
    await cache.fetchQuery(musicQueries.lyrics('t1'));
    await cache.fetchQuery(musicQueries.playlists());
    await cache.fetchQuery(musicQueries.playlist('p'));
    await cache.fetchQuery(musicQueries.devices());

    expect(music.fetchAlbums).toHaveBeenCalledWith('recent');
    expect(music.fetchArtists).toHaveBeenCalledWith(true);
    expect(music.fetchAlbum).toHaveBeenCalledWith('a');
    expect(music.fetchArtist).toHaveBeenCalledWith('b');
    expect(music.fetchArtistStory).toHaveBeenCalledWith('b');
    expect(music.fetchTracks).toHaveBeenCalledWith(['t1', 't2']);
    expect(music.fetchLiked).toHaveBeenCalledOnce();
    expect(music.searchMusic).toHaveBeenCalledWith('blue');
    expect(music.fetchLyrics).toHaveBeenCalledWith('t1');
    expect(playlists.fetchPlaylists).toHaveBeenCalledOnce();
    expect(playlists.fetchPlaylist).toHaveBeenCalledWith('p');
    expect(devices.fetchMusicDevices).toHaveBeenCalledOnce();
  });
});
