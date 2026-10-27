import { describe, expect, it } from 'vitest';
import { mediaItem, rating } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { yourStars } from './yourStars';

const STARTING_POSTGRES_MS = 60_000;

describe('yourStars', { timeout: STARTING_POSTGRES_MS }, () => {
  it('reads what one profile gave an item, and nothing where it gave none', async () => {
    const { db } = await aHousehold();

    await db.insert(rating).values({ id: 'r1', profileId: 'pat', mediaItemId: 'film', stars: 4 });

    await expect(db.select({ stars: yourStars('pat') }).from(mediaItem)).resolves.toEqual([
      { stars: 4 },
    ]);
    await expect(db.select({ stars: yourStars('sam') }).from(mediaItem)).resolves.toEqual([
      { stars: null },
    ]);
  });
});
