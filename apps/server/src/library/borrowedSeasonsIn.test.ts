import { describe, expect, it } from 'vitest';
import { borrowedSeasonsIn } from './borrowedSeasonsIn';

const SOURCES = [
  {
    folder: '/shows/Old Show (2016)',
    seasonNumber: 7,
    externalId: '900',
    externalSeason: 1,
    title: 'Old Show',
    year: 2026,
  },
  {
    folder: '/shows/Another (2016)',
    seasonNumber: 2,
    externalId: '901',
    externalSeason: 1,
    title: 'Another',
    year: null,
  },
];

describe('borrowedSeasonsIn', () => {
  it('reads the seasons of a programme somebody said are another show’s', () => {
    expect(borrowedSeasonsIn(SOURCES, '/shows/Old Show (2016)')).toEqual({
      borrowed: [{ seasonNumber: 7, externalId: '900', externalSeason: 1 }],
    });
  });

  it('says nothing for a programme with none, or a file that is no episode of one', () => {
    expect(borrowedSeasonsIn(SOURCES, '/shows/Third (2016)')).toEqual({});
    expect(borrowedSeasonsIn(SOURCES, null)).toEqual({});
  });
});
