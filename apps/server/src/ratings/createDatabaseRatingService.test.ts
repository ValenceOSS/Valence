import { describe, expect, it } from 'vitest';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { createDatabaseRatingService } from './createDatabaseRatingService';

const STARTING_POSTGRES_MS = 60_000;

describe('createDatabaseRatingService', { timeout: STARTING_POSTGRES_MS }, () => {
  it('changes a rating given again rather than adding a second', async () => {
    const { db } = await aHousehold();
    const ratings = createDatabaseRatingService(db);

    await ratings.set('pat', { mediaId: 'film' }, 3);
    await ratings.set('pat', { mediaId: 'film' }, 5);
    await ratings.set('pat', { mediaId: 'film' }, 5);

    const listed = await ratings.list('pat');

    expect(listed).toHaveLength(1);
    expect(listed[0]?.stars).toBe(5);
  });

  it('keeps each profile its own rating of the same thing', async () => {
    const { db } = await aHousehold();
    const ratings = createDatabaseRatingService(db);

    await ratings.set('pat', { mediaId: 'film' }, 2);
    await ratings.set('sam', { mediaId: 'film' }, 4);

    await expect(ratings.household({ mediaId: 'film' })).resolves.toEqual({
      average: 3,
      count: 2,
    });
  });
});
