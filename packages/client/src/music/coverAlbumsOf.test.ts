import { describe, expect, it } from 'vitest';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { coverAlbumsOf } from './coverAlbumsOf';

const albumOf = (n: number, hasArtwork = true) => ({
  album: {
    id: `00000000-0000-4000-8000-0000000a${n.toString().padStart(4, '0')}`,
    title: `Album ${n.toString()}`,
    hasArtwork,
  },
});

describe('coverAlbumsOf', () => {
  it('takes the first four different albums, in the order their songs come up', () => {
    const tracks = [1, 1, 2, 3, 2, 4, 5].map((n, at) => aTrack(at, albumOf(n)));

    expect(coverAlbumsOf(tracks)).toEqual([1, 2, 3, 4].map((n) => albumOf(n).album.id));
  });

  it('passes over an album that has no cover', () => {
    const tracks = [aTrack(1, albumOf(1, false)), aTrack(2, albumOf(2))];

    expect(coverAlbumsOf(tracks)).toEqual([albumOf(2).album.id]);
  });

  it('has nothing for no songs', () => {
    expect(coverAlbumsOf([])).toEqual([]);
  });
});
