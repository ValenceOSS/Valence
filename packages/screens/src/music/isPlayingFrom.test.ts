import { describe, expect, it } from 'vitest';
import { startQueue } from '@ValenceClient/music/playQueue';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { isPlayingFrom } from './isPlayingFrom';

const SONG = aTrack(1);

const from = (kind: 'playlist' | 'artist' | 'liked', id: string | null) => ({
  current: SONG,
  queue: startQueue([SONG], 0, { source: { kind, id, name: 'x' } }),
});

describe('isPlayingFrom', () => {
  it('marks the album the song playing is on, however it came to be playing', () => {
    expect(isPlayingFrom({ kind: 'album', id: SONG.album.id }, from('liked', null))).toBe(true);
    expect(isPlayingFrom({ kind: 'album', id: 'another' }, from('liked', null))).toBe(false);
  });

  it('marks the playlist the queue was started from', () => {
    expect(isPlayingFrom({ kind: 'playlist', id: 'p1' }, from('playlist', 'p1'))).toBe(true);
    expect(isPlayingFrom({ kind: 'playlist', id: 'p2' }, from('playlist', 'p1'))).toBe(false);
  });

  it('marks the liked songs when they were started', () => {
    expect(isPlayingFrom({ kind: 'liked' }, from('liked', null))).toBe(true);
  });

  it('marks nothing while nothing plays', () => {
    expect(isPlayingFrom({ kind: 'liked' }, { current: null, queue: null })).toBe(false);
  });
});
