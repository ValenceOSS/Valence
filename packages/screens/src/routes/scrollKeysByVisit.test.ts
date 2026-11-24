import { beforeEach, describe, expect, it } from 'vitest';
import { scrollKeysByVisit } from './scrollKeysByVisit';

/**
 * A history entry at an address, as much of one as the key reads.
 *
 * @param entry - The history entry's own key.
 * @param index - Where the entry sits in the history.
 * @param pathname - The path.
 * @param searchStr - The query string, leading question mark and all.
 * @returns The location.
 */
const at = (entry: string, index: number, pathname: string, searchStr = '') => ({
  pathname,
  searchStr,
  state: { __TSR_key: entry, __TSR_index: index },
});

describe('scrollKeysByVisit', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('gives a page arrived at again by a link a key of its own, so it starts at the top', () => {
    const keyOf = scrollKeysByVisit();
    const first = keyOf(at('a', 0, '/films'));

    keyOf(at('b', 1, '/'));
    keyOf(at('a', 0, '/films'));

    expect(keyOf(at('c', 2, '/films'))).not.toBe(first);
  });

  it('gives going back to a visit the key it had, so it is put back where it was left', () => {
    const keyOf = scrollKeysByVisit();
    const films = keyOf(at('a', 0, '/films'));

    keyOf(at('b', 1, '/'));

    expect(keyOf(at('a', 0, '/films'))).toBe(films);
  });

  it('keeps a dialog opened over a page in that page’s visit, so the page beneath stays put', () => {
    const keyOf = scrollKeysByVisit();
    const page = keyOf(at('a', 0, '/'));

    expect(keyOf(at('b', 1, '/', '?item=episode-1'))).toBe(page);
    expect(keyOf(at('c', 2, '/'))).toBe(page);
  });

  it('starts a fresh visit to a page gone back from, rather than taking up the old visit', () => {
    const keyOf = scrollKeysByVisit();

    keyOf(at('a', 0, '/'));
    const films = keyOf(at('b', 1, '/films'));

    keyOf(at('a', 0, '/'));

    expect(keyOf(at('c', 1, '/films'))).not.toBe(films);
  });

  it('keeps the key of the page a reload lands on, so its place survives the reload', () => {
    const before = scrollKeysByVisit()(at('a', 3, '/films'));

    expect(scrollKeysByVisit()(at('a', 3, '/films'))).toBe(before);
  });

  it('keeps a dialog in its page’s visit across a reload', () => {
    const keyOf = scrollKeysByVisit();
    const page = keyOf(at('a', 0, '/'));

    keyOf(at('b', 1, '/', '?item=episode-1'));

    expect(scrollKeysByVisit()(at('b', 1, '/', '?item=episode-1'))).toBe(page);
  });
});
