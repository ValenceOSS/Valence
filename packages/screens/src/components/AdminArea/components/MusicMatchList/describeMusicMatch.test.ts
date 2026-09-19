import { describe, expect, it } from 'vitest';
import { describeMusicMatch } from './describeMusicMatch';

const ALBUM = {
  kind: 'album' as const,
  musicBrainzId: 'f5093c06-23e3-404f-aeaa-40f72885ee3a',
  title: 'The Dark Side of the Moon',
  artist: 'Pink Floyd',
  disambiguation: null,
  type: 'album' as const,
  year: 1973,
  coverUrl: null,
};

describe('describeMusicMatch', () => {
  it('says an album’s artist, kind and year, and an artist’s year and what sets them apart', () => {
    expect(describeMusicMatch(ALBUM)).toBe('Pink Floyd · Album · 1973');
    expect(
      describeMusicMatch({
        ...ALBUM,
        kind: 'artist',
        artist: null,
        type: null,
        year: 1965,
        disambiguation: 'UK rock band',
      }),
    ).toBe('1965 · UK rock band');
  });

  it('says nothing where there is nothing to say', () => {
    expect(describeMusicMatch({ ...ALBUM, artist: null, type: null, year: null })).toBeNull();
  });
});
