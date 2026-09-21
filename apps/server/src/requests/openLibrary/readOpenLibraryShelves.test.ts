import { describe, expect, it } from 'vitest';
import { readOpenLibraryShelves } from '@ValenceServer/requests/openLibrary/readOpenLibraryShelves';
import { aWebThatAnswers } from '@ValenceServer/testing/aWebThatAnswers';

describe('readOpenLibraryShelves', () => {
  it('reads what is trending, and the best known of each subject', async () => {
    const web = aWebThatAnswers({
      '/trending/weekly.json': {
        works: [
          {
            key: '/works/OL1W',
            title: 'Trending One',
            author_name: ['A. Writer'],
            first_publish_year: 2020,
            cover_i: 7,
          },
        ],
      },
      '/subjects/science_fiction.json': {
        works: [
          {
            key: '/works/OL2W',
            title: 'Dune',
            authors: [{ name: 'Frank Herbert' }],
            first_publish_year: 1965,
            cover_id: 9,
          },
        ],
      },
    });

    const shelves = await readOpenLibraryShelves(web);

    expect(shelves.map((shelf) => shelf.title)).toEqual(['Trending books', 'Science fiction']);
    expect(shelves[0]?.books).toEqual([
      {
        openLibraryId: 1,
        title: 'Trending One',
        author: 'A. Writer',
        year: 2020,
        coverUrl: 'https://covers.openlibrary.org/b/id/7-M.jpg',
      },
    ]);
    expect(shelves[1]?.books[0]).toMatchObject({ openLibraryId: 2, author: 'Frank Herbert' });
  });

  it('leaves out a shelf with nothing on it, or that could not be read', async () => {
    const web = aWebThatAnswers({
      '/trending/weekly.json': { works: [] },
      '/subjects/fantasy.json': 'nonsense',
    });

    await expect(readOpenLibraryShelves(web)).resolves.toEqual([]);
  });

  it('skips a work it cannot make sense of, and keeps the rest of its shelf', async () => {
    const web = aWebThatAnswers({
      '/trending/weekly.json': {
        works: [
          { key: '/authors/OL3A', title: 'Not a work' },
          { key: '/works/OL4W', title: 'Real' },
          null,
        ],
      },
    });

    const [shelf] = await readOpenLibraryShelves(web);

    expect(shelf?.books.map((book) => book.title)).toEqual(['Real']);
  });
});
