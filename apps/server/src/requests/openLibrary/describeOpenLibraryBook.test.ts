import { describe, expect, it } from 'vitest';
import { describeOpenLibraryBook } from '@ValenceServer/requests/openLibrary/describeOpenLibraryBook';
import { aWebThatAnswers } from '@ValenceServer/testing/aWebThatAnswers';

describe('describeOpenLibraryBook', () => {
  it('reads what a work is, what it is about, who wrote it and when it came out', async () => {
    const web = aWebThatAnswers({
      '/works/OL21277329W.json': {
        title: 'Project Hail Mary',
        description: 'A lone astronaut wakes up.',
        subjects: ['Science fiction', 'Space flight'],
        covers: [-1, 10_389_354],
        first_publish_date: 'May 4, 2021',
        authors: [{ author: { key: '/authors/OL7A' } }],
      },
      '/authors/OL7A.json': { name: 'Andy Weir' },
    });

    await expect(describeOpenLibraryBook(web, 21_277_329)).resolves.toEqual({
      title: 'Project Hail Mary',
      year: 2021,
      overview: 'A lone astronaut wakes up.',
      posterUrl: 'https://covers.openlibrary.org/b/id/10389354-M.jpg',
      authors: ['Andy Weir'],
      subjects: ['Science fiction', 'Space flight'],
    });
  });

  it('reads a description given as an object with a value', async () => {
    const web = aWebThatAnswers({
      '/works/OL9W.json': { title: 'Old Book', description: { type: '/type/text', value: 'Old.' } },
    });

    await expect(describeOpenLibraryBook(web, 9)).resolves.toMatchObject({ overview: 'Old.' });
  });

  it('says nothing of what it does not know, rather than making something up', async () => {
    const web = aWebThatAnswers({ '/works/OL9W.json': { title: 'Bare' } });

    await expect(describeOpenLibraryBook(web, 9)).resolves.toEqual({
      title: 'Bare',
      year: null,
      overview: null,
      posterUrl: null,
      authors: [],
      subjects: [],
    });
  });

  it('names no more than three authors, and skips one it cannot read', async () => {
    const web = aWebThatAnswers({
      '/works/OL9W.json': {
        title: 'Anthology',
        authors: [
          { author: { key: '/authors/OL1A' } },
          { author: { key: '/authors/OL2A' } },
          { author: { key: '/authors/OL3A' } },
          { author: { key: '/authors/OL4A' } },
        ],
      },
      '/authors/OL1A.json': { name: 'One' },
      '/authors/OL3A.json': { name: 'Three' },
      '/authors/OL4A.json': { name: 'Four' },
    });

    await expect(describeOpenLibraryBook(web, 9)).resolves.toMatchObject({
      authors: ['One', 'Three'],
    });
  });

  it('is nothing where the work is not known, or Open Library could not be asked', async () => {
    await expect(describeOpenLibraryBook(aWebThatAnswers({}), 9)).resolves.toBeNull();
    await expect(
      describeOpenLibraryBook(aWebThatAnswers({ '/works/OL9W.json': { nonsense: true } }), 9),
    ).resolves.toBeNull();
  });

  it('takes the year from however the date is written', async () => {
    for (const [date, year] of [
      ['1965', 1965],
      ['1965-05-01', 1965],
      ['May 1965', 1965],
      ['sometime', null],
    ] as const) {
      const web = aWebThatAnswers({ '/works/OL9W.json': { title: 'X', first_publish_date: date } });

      await expect(describeOpenLibraryBook(web, 9)).resolves.toMatchObject({ year });
    }
  });
});
