import { describe, expect, it } from 'vitest';
import { favourite, mediaItem } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { isLikedBy } from './isLikedBy';

const STARTING_POSTGRES_MS = 60_000;

describe('isLikedBy', { timeout: STARTING_POSTGRES_MS }, () => {
  it('holds for what one profile liked, and not for another profile', async () => {
    const { db } = await aHousehold();

    await db.insert(mediaItem).values(aMediaItemRow('song', 'music'));
    await db.insert(favourite).values({ id: 'f1', profileId: 'pat', mediaItemId: 'song' });

    await expect(
      db.select({ id: mediaItem.id }).from(mediaItem).where(isLikedBy(db, 'pat')),
    ).resolves.toEqual([{ id: 'song' }]);
    await expect(
      db.select({ id: mediaItem.id }).from(mediaItem).where(isLikedBy(db, 'sam')),
    ).resolves.toEqual([]);
  });
});
