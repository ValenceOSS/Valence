import { describe, expect, it } from 'vitest';
import { sortNameFor } from './sortNameFor';

describe('sortNameFor', () => {
  it('files a band under its name rather than its article', () => {
    expect(sortNameFor('The Beatles')).toBe('beatles');
  });

  it('leaves a name with no article alone', () => {
    expect(sortNameFor('Sleep Token')).toBe('sleep token');
  });

  it('keeps an article that is the whole name', () => {
    expect(sortNameFor('The')).toBe('the');
  });
});
