import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aTrack } from '@ValenceScreens/testing/aTrack';
import { tracksFor } from './tracksFor';

const music = vi.hoisted(() => ({
  fetchAlbum: vi.fn(),
  fetchArtist: vi.fn(),
  fetchLiked: vi.fn(),
}));

const playlists = vi.hoisted(() => ({ fetchPlaylist: vi.fn() }));

vi.mock('@ValenceClient/music/fetchMusic', () => music);

vi.mock('@ValenceClient/music/fetchPlaylists', () => playlists);

beforeEach(() => {
  music.fetchAlbum.mockResolvedValue({ tracks: [aTrack(1)] });
  music.fetchArtist.mockResolvedValue({ popular: [aTrack(2)] });
  music.fetchLiked.mockResolvedValue([aTrack(3)]);
  playlists.fetchPlaylist.mockResolvedValue({
    playlist: { isOrdered: true },
    entries: [{ item: { track: aTrack(4) } }, { item: { track: null } }],
  });
});

describe('tracksFor', () => {
  it('plays an album’s songs', async () => {
    expect(await tracksFor({ kind: 'album', id: 'a1' }, 'Arcadia')).toEqual({
      tracks: [aTrack(1)],
      source: { kind: 'album', id: 'a1', name: 'Arcadia' },
      isOrdered: false,
    });
  });

  it('plays an artist’s most played', async () => {
    expect((await tracksFor({ kind: 'artist', id: 'r1' }, 'Sleep Token'))?.tracks).toEqual([
      aTrack(2),
    ]);
  });

  it('plays a playlist’s songs, in its order where it has one, skipping what is gone', async () => {
    const found = await tracksFor({ kind: 'playlist', id: 'p1' }, 'Sunday');

    expect(found?.tracks).toEqual([aTrack(4)]);
    expect(found?.isOrdered).toBe(true);
  });

  it('plays everything liked', async () => {
    expect((await tracksFor({ kind: 'liked' }, 'Liked Songs'))?.tracks).toEqual([aTrack(3)]);
  });

  it('plays nothing for a page that is not a list of songs', async () => {
    expect(await tracksFor({ kind: 'lyrics' }, 'Lyrics')).toBeNull();
  });
});
