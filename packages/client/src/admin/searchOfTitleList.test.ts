import { describe, expect, it } from 'vitest';
import { searchOfTitleList } from './searchOfTitleList';

describe('searchOfTitleList', () => {
  it('writes the library, order, search, quick filter, every chip and where to start', () => {
    const query = new URLSearchParams(
      searchOfTitleList(
        {
          libraryId: 'lib',
          sort: 'size',
          isDescending: true,
          search: ' heat ',
          show: 'edited',
          filters: ['genre:Crime', 'tag:x'],
        },
        'next-page',
      ).slice(1),
    );

    expect(query.get('libraryId')).toBe('lib');
    expect(query.get('sort')).toBe('size');
    expect(query.get('desc')).toBe('true');
    expect(query.get('search')).toBe('heat');
    expect(query.get('show')).toBe('edited');
    expect(query.getAll('filter')).toEqual(['genre:Crime', 'tag:x']);
    expect(query.get('after')).toBe('next-page');
  });

  it('leaves out a search of nothing', () => {
    expect(
      searchOfTitleList({
        libraryId: 'lib',
        sort: 'title',
        isDescending: false,
        search: '  ',
        show: 'all',
        filters: [],
      }),
    ).not.toContain('search');
  });
});
