import { describe, expect, it } from 'vitest';
import { searchOfList } from './searchOfList';

describe('searchOfList', () => {
  it('names only what somebody changed', () => {
    expect(
      searchOfList({
        library: null,
        search: '',
        show: 'all',
        sort: 'title',
        isDescending: false,
        filters: [],
      }),
    ).toEqual({});
  });

  it('writes the library, search, quick filter, order and chips', () => {
    expect(
      searchOfList({
        library: 'lib',
        search: 'heat',
        show: 'edited',
        sort: 'size',
        isDescending: true,
        filters: ['genre:Crime'],
      }),
    ).toEqual({
      library: 'lib',
      find: 'heat',
      quick: 'edited',
      order: 'size',
      desc: true,
      filter: ['genre:Crime'],
    });
  });
});
