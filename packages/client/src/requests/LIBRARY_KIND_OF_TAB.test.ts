import { describe, expect, it } from 'vitest';
import { LIBRARY_KIND_OF_TAB } from './LIBRARY_KIND_OF_TAB';

describe('LIBRARY_KIND_OF_TAB', () => {
  it('names the kind of library behind each Catalogue tab', () => {
    expect(LIBRARY_KIND_OF_TAB).toEqual({
      films: 'movies',
      shows: 'shows',
      music: 'music',
      books: 'books',
    });
  });
});
