import { describe, expect, it } from 'vitest';
import { ArrNamedListSchema } from './ArrNamedListSchema';

describe('ArrNamedListSchema', () => {
  it('reads quality and metadata profiles by their ids and names alone', () => {
    expect(
      ArrNamedListSchema.parse([
        {
          name: 'HD-1080p',
          upgradeAllowed: true,
          cutoff: 7,
          items: [{ quality: { id: 7, name: 'Bluray-1080p' }, items: [], allowed: true }],
          minFormatScore: 0,
          cutoffFormatScore: 0,
          formatItems: [],
          language: { id: 1, name: 'English' },
          id: 4,
        },
        {
          name: 'Standard',
          primaryAlbumTypes: [{ albumType: { id: 0, name: 'Album' }, allowed: true }],
          id: 1,
        },
      ]),
    ).toEqual([
      { id: 4, name: 'HD-1080p' },
      { id: 1, name: 'Standard' },
    ]);
  });
});
