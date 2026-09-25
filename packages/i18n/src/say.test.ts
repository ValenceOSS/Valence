import { describe, expect, it } from 'vitest';
import { say } from './say';

describe('say', () => {
  it('says the words the strings file holds for a key', () => {
    expect(say('common.cancel')).toBe('Cancel');
  });

  it('fills a gap from what is given', () => {
    expect(say('common.nothingMatches', { query: 'dune' })).toBe('Nothing matches “dune”');
  });

  it('leaves a gap as written where nothing was given for it', () => {
    expect(say('common.nothingMatches')).toBe('Nothing matches “{query}”');
  });
});
