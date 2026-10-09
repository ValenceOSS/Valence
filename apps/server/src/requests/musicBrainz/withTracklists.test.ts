import { describe, expect, it } from 'vitest';
import { withTracklists } from './withTracklists';

const ALBUM = { id: 'album', title: 'An Album', type: 'album' as const, firstReleased: null };

const SINGLE = { id: 'single', title: 'A Single', type: 'single' as const, firstReleased: null };

const OTHER = {
  id: 'other',
  title: 'Another Single',
  type: 'single' as const,
  firstReleased: null,
};

describe('withTracklists', () => {
  it('says how many tracks each longest edition has, and which singles are on an album', () => {
    expect(
      withTracklists(
        [ALBUM, SINGLE, OTHER],
        new Map([
          ['album', { trackCount: 12, recordings: ['a', 'b'], tracks: [] }],
          ['single', { trackCount: 1, recordings: ['a'], tracks: [] }],
          ['other', { trackCount: 2, recordings: ['a', 'z'], tracks: [] }],
        ]),
      ),
    ).toEqual([
      { ...ALBUM, trackCount: 12 },
      { ...SINGLE, trackCount: 1, isOnAnAlbum: true },
      { ...OTHER, trackCount: 2, isOnAnAlbum: false },
    ]);
  });

  it('leaves an album MusicBrainz lists no release of as it was', () => {
    expect(withTracklists([ALBUM], new Map())).toEqual([ALBUM]);
  });
});
