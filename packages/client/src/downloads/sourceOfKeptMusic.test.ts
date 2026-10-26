import { describe, expect, it } from 'vitest';
import { sourceOfKeptMusic } from './sourceOfKeptMusic';

describe('sourceOfKeptMusic', () => {
  it('says an album is playing from that album', () => {
    expect(sourceOfKeptMusic({ kind: 'album', id: 'a', title: 'Even In Arcadia' })).toEqual({
      kind: 'album',
      id: 'a',
      name: 'Even In Arcadia',
    });
  });

  it('says a playlist is playing from that playlist', () => {
    expect(sourceOfKeptMusic({ kind: 'playlist', id: 'p', title: 'Late' })).toEqual({
      kind: 'playlist',
      id: 'p',
      name: 'Late',
    });
  });

  it('says liked songs are playing from liked songs, which have no id of their own', () => {
    expect(sourceOfKeptMusic({ kind: 'liked', id: 'liked', title: 'Liked songs' })).toEqual({
      kind: 'liked',
      id: null,
      name: 'Liked songs',
    });
  });

  it('says anything else is playing from a run of tracks', () => {
    expect(sourceOfKeptMusic({ kind: 'audiobook', id: 'b', title: 'Red Rising' }).kind).toBe(
      'tracks',
    );
  });
});
