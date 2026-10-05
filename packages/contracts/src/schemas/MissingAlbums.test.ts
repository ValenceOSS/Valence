import { describe, expect, it } from 'vitest';
import { MissingAlbumsSchema } from './MissingAlbums';

describe('MissingAlbumsSchema', () => {
  it('reads a playlist’s missing albums, matched or still being looked for', () => {
    const read = MissingAlbumsSchema.parse({
      isMatching: true,
      albums: [
        {
          key: 'release',
          title: 'Isles',
          artist: 'Bicep',
          coverUrl: null,
          songCount: 2,
          isMatched: false,
          found: null,
        },
      ],
    });

    expect(read.albums[0]?.songCount).toBe(2);
  });

  it('refuses an album with no songs', () => {
    expect(
      MissingAlbumsSchema.safeParse({
        isMatching: false,
        albums: [
          {
            key: 'k',
            title: 'T',
            artist: 'A',
            coverUrl: null,
            songCount: 0,
            isMatched: true,
            found: null,
          },
        ],
      }).success,
    ).toBe(false);
  });
});
