import { describe, expect, it } from 'vitest';
import { libraryLinkKey } from './libraryLinkKey';

describe('libraryLinkKey', () => {
  it('names one folder of one library', () => {
    expect(libraryLinkKey('lib', '/data/movies')).toBe('lib|/data/movies');
  });
});
