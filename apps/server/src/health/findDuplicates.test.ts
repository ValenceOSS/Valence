import { describe, expect, it } from 'vitest';
import { findDuplicates } from './findDuplicates';

const anItem = (id: string, rest: Partial<Parameters<typeof findDuplicates>[0][number]> = {}) => ({
  id,
  externalId: null,
  seriesId: null,
  seasonNumber: null,
  episodeNumber: null,
  ...rest,
});

describe('findDuplicates', () => {
  it('finds a film matched to the same entry twice', () => {
    const found = findDuplicates([
      anItem('a', { externalId: '335984' }),
      anItem('b', { externalId: '335984' }),
      anItem('c', { externalId: '78' }),
    ]);

    expect([...found.keys()]).toEqual(['a', 'b']);
    expect(found.get('a')).toBe(found.get('b'));
  });

  it('finds an episode filed twice under the same season and number', () => {
    const found = findDuplicates([
      anItem('e1', { seriesId: 's', seasonNumber: 1, episodeNumber: 1 }),
      anItem('e1b', { seriesId: 's', seasonNumber: 1, episodeNumber: 1 }),
      anItem('e2', { seriesId: 's', seasonNumber: 1, episodeNumber: 2 }),
    ]);

    expect([...found.keys()]).toEqual(['e1', 'e1b']);
  });

  it('leaves unmatched films and unnumbered episodes alone', () => {
    expect(
      findDuplicates([
        anItem('a'),
        anItem('b'),
        anItem('c', { seriesId: 's' }),
        anItem('d', { seriesId: 's' }),
      ]).size,
    ).toBe(0);
  });
});
