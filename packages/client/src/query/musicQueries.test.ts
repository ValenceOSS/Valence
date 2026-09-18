import { describe, expect, it } from 'vitest';
import { musicQueries } from './musicQueries';

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
});
