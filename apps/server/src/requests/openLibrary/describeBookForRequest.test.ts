import { describe, expect, it } from 'vitest';
import { describeBookForRequest } from '@ValenceServer/requests/openLibrary/describeBookForRequest';
import { aWebThatAnswers } from '@ValenceServer/testing/aWebThatAnswers';

describe('describeBookForRequest', () => {
  it('says what a request for a book keeps of it: title, year, summary, cover and author', async () => {
    const web = aWebThatAnswers({
      '/works/OL21277329W.json': {
        title: 'Project Hail Mary',
        description: 'A lone astronaut wakes up.',
        covers: [10_389_354],
        first_publish_date: '2021',
        authors: [{ author: { key: '/authors/OL7A' } }],
      },
      '/authors/OL7A.json': { name: 'Andy Weir' },
    });

    await expect(describeBookForRequest(web, 21_277_329)).resolves.toMatchObject({
      title: 'Project Hail Mary',
      year: 2021,
      overview: 'A lone astronaut wakes up.',
      posterUrl: 'https://covers.openlibrary.org/b/id/10389354-M.jpg',
      artist: 'Andy Weir',
      episodes: [],
      albums: [],
      isEnded: true,
    });
  });

  it('has no author to keep where Open Library names none', async () => {
    const web = aWebThatAnswers({ '/works/OL9W.json': { title: 'Anonymous' } });

    await expect(describeBookForRequest(web, 9)).resolves.toMatchObject({ artist: null });
  });

  it('is nothing where Open Library does not know the work', async () => {
    await expect(describeBookForRequest(aWebThatAnswers({}), 9)).resolves.toBeNull();
  });
});
