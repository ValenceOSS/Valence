import { describe, expect, it } from 'vitest';
import { requestsViewShown } from './requestsViewShown';

describe('requestsViewShown', () => {
  it('is Discover where the address names no view', () => {
    expect(requestsViewShown(null)).toBe('discover');
  });

  it('files a whole list of films under Movies, whichever list it is', () => {
    expect(requestsViewShown('film:popular')).toBe('film:popular');
    expect(requestsViewShown('film:trending')).toBe('film:popular');
  });

  it('files a whole list of programmes under Shows', () => {
    expect(requestsViewShown('series:trending')).toBe('series:popular');
  });

  it('keeps music, books and your own requests as they are', () => {
    expect(requestsViewShown('music')).toBe('music');
    expect(requestsViewShown('books')).toBe('books');
    expect(requestsViewShown('mine')).toBe('mine');
  });

  it('files a search of Discover under Discover', () => {
    expect(requestsViewShown('find:dune')).toBe('discover');
  });

  it('falls back to Discover for a view it does not know', () => {
    expect(requestsViewShown('nonsense')).toBe('discover');
  });
});
