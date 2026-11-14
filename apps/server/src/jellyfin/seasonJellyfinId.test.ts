import { describe, expect, it } from 'vitest';
import { seasonJellyfinId } from './seasonJellyfinId';
import { seasonPrefixOf } from './seasonPrefixOf';

describe('seasonJellyfinId', () => {
  it('begins with the programme’s digits and ends with the season', () => {
    const id = seasonJellyfinId('a:twin-peaks', 2);

    expect(id).toMatch(/^[0-9a-f]{32}$/u);
    expect(id.startsWith(seasonPrefixOf('a:twin-peaks'))).toBe(true);
    expect(id.endsWith('0002')).toBe(true);
  });

  it('marks episodes with no season apart from season nought', () => {
    expect(seasonJellyfinId('a:x', null)).not.toBe(seasonJellyfinId('a:x', 0));
  });
});
