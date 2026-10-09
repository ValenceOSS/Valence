import { describe, expect, it } from 'vitest';
import { catalogueTabsOf } from './catalogueTabsOf';

describe('catalogueTabsOf', () => {
  it('has a tab for each kind of library the server has, and none for any it lacks', () => {
    expect(catalogueTabsOf([{ kind: 'shows' }, { kind: 'movies' }, { kind: 'shows' }])).toEqual([
      'films',
      'shows',
    ]);
  });

  it('has every tab while the libraries are not yet known', () => {
    expect(catalogueTabsOf(undefined)).toEqual(['films', 'shows', 'music', 'books']);
  });
});
