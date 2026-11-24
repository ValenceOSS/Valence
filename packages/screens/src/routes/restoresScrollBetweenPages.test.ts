import { describe, expect, it } from 'vitest';
import { scrollKeyOf } from '@ValenceScreens/routes/scrollKeyOf';
import { scrollKeysByVisit } from '@ValenceScreens/routes/scrollKeysByVisit';
import { restoresScrollBetweenPages } from './restoresScrollBetweenPages';

/**
 * An address, as much of one as the rule reads.
 *
 * @param pathname - The path.
 * @param searchStr - The query string, leading question mark and all.
 * @returns What the router tells the rule.
 */
const at = (pathname: string, searchStr = '') => ({ location: { pathname, searchStr } });

describe('restoresScrollBetweenPages', () => {
  it('restores on the first page the router shows', () => {
    expect(restoresScrollBetweenPages(scrollKeyOf)(at('/'))).toBe(true);
  });

  it('restores nothing as a dialog opens, changes or closes over the same page', () => {
    const restores = restoresScrollBetweenPages(scrollKeyOf);

    restores(at('/'));

    expect(restores(at('/', '?item=episode-1'))).toBe(false);
    expect(restores(at('/'))).toBe(false);
    expect(restores(at('/', '?item=episode-2'))).toBe(false);
  });

  it('restores on arriving at another page, and on coming back to one', () => {
    const restores = restoresScrollBetweenPages(scrollKeyOf);

    restores(at('/'));

    expect(restores(at('/shows'))).toBe(true);
    expect(restores(at('/', '?item=episode-1'))).toBe(true);
  });

  it('restores on going back to an earlier visit to the same page', () => {
    const restores = restoresScrollBetweenPages(scrollKeysByVisit());
    const entry = (key: string, index: number, pathname: string) => ({
      location: { pathname, searchStr: '', state: { __TSR_key: key, __TSR_index: index } },
    });

    restores(entry('a', 0, '/'));
    restores(entry('b', 1, '/films'));
    restores(entry('c', 2, '/'));

    expect(restores(entry('a', 0, '/'))).toBe(true);
  });
});
