import { describe, expect, it } from 'vitest';
import { readSeasonJellyfinId } from './readSeasonJellyfinId';
import { seasonJellyfinId } from './seasonJellyfinId';
import { seasonPrefixOf } from './seasonPrefixOf';

describe('readSeasonJellyfinId', () => {
  it('reads back the programme’s digits and the season', () => {
    expect(readSeasonJellyfinId(seasonJellyfinId('a:x', 12))).toEqual({
      prefix: seasonPrefixOf('a:x'),
      seasonNumber: 12,
    });
  });

  it('reads an unnumbered season as nothing', () => {
    expect(readSeasonJellyfinId(seasonJellyfinId('a:x', null)).seasonNumber).toBeNull();
  });
});
