import { describe, expect, it } from 'vitest';
import { searchOpenLibrary } from '@ValenceServer/requests/openLibrary/searchOpenLibrary';
import { aWebThatAnswers } from '@ValenceServer/testing/aWebThatAnswers';

describe('searchOpenLibrary', () => {
  it('finds the works matching what was typed, with their author, year and cover', async () => {
    const web = aWebThatAnswers({
      '/search.json': {
        docs: [
          {
            key: '/works/OL21277329W',
            title: 'Project Hail Mary',
            author_name: ['Andy Weir'],
            first_publish_year: 2021,
            cover_i: 10_389_354,
          },
        ],
      },
    });

    await expect(searchOpenLibrary(web, 'hail mary')).resolves.toEqual([
      {
        openLibraryId: 21_277_329,
        title: 'Project Hail Mary',
        author: 'Andy Weir',
        year: 2021,
        coverUrl: 'https://covers.openlibrary.org/b/id/10389354-M.jpg',
      },
    ]);
  });

  it('says what was typed in the address, and asks only for what it uses', async () => {
    const web = aWebThatAnswers({ '/search.json': { docs: [] } });

    await searchOpenLibrary(web, 'dune & herbert');

    const asked = new URL(web.json.mock.calls[0]?.[0] ?? '');

    expect(asked.searchParams.get('q')).toBe('dune & herbert');
    expect(asked.searchParams.get('fields')).toBe(
      'key,title,author_name,first_publish_year,cover_i',
    );
  });

  it('copes with a work that has no author, year or cover', async () => {
    const web = aWebThatAnswers({
      '/search.json': { docs: [{ key: '/works/OL5W', title: 'Anonymous' }] },
    });

    await expect(searchOpenLibrary(web, 'anon')).resolves.toEqual([
      { openLibraryId: 5, title: 'Anonymous', author: null, year: null, coverUrl: null },
    ]);
  });

  it('skips what is not a work, or cannot be read', async () => {
    const web = aWebThatAnswers({
      '/search.json': {
        docs: [{ key: '/authors/OL1A', title: 'Not a work' }, { nonsense: true }, null],
      },
    });

    await expect(searchOpenLibrary(web, 'x')).resolves.toEqual([]);
  });

  it('finds nothing where Open Library could not be asked, or answered with rubbish', async () => {
    await expect(searchOpenLibrary(aWebThatAnswers({}), 'x')).resolves.toEqual([]);
    await expect(
      searchOpenLibrary(aWebThatAnswers({ '/search.json': 'nonsense' }), 'x'),
    ).resolves.toEqual([]);
  });
});
