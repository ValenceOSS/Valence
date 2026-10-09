import { describe, expect, it } from 'vitest';
import { withoutIds } from './withoutIds';

describe('withoutIds', () => {
  it('keeps the words and the episode, and drops the ids', () => {
    expect(
      withoutIds({
        query: 'the office',
        mode: 'tv',
        tvdbId: 73244,
        imdbId: 'tt0386676',
        season: 2,
      }),
    ).toEqual({ query: 'the office', mode: 'tv', season: 2 });
  });
});
