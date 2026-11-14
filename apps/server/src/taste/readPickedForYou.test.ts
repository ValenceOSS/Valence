import { describe, expect, it } from 'vitest';
import { favourite, mediaItem, rating, watchHistory } from '#dialect/Schema';
import { indexLikeness } from '@ValenceServer/likeness/indexLikeness';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { readPickedForYou } from './readPickedForYou';

const STARTING_POSTGRES_MS = 60_000;

const NOTHING_KNOWN = indexLikeness([]);

/**
 * A household with romances, a thriller and a western, where one profile watched a romance through.
 *
 * @returns The household.
 */
const aWatchingHousehold = async () => {
  const household = await aHousehold();
  const { db } = household;

  await db.insert(mediaItem).values([
    { ...aMediaItemRow('watched', 'films'), genres: ['Romance', 'Comedy'] },
    { ...aMediaItemRow('romance', 'films'), genres: ['Romance', 'Comedy'], rating: 7 },
    { ...aMediaItemRow('kept', 'films'), genres: ['Romance', 'Comedy'] },
    { ...aMediaItemRow('thriller', 'films'), genres: ['Thriller', 'Crime'] },
    { ...aMediaItemRow('western', 'films'), genres: ['Western'] },
  ]);
  await db.insert(watchHistory).values({
    id: 'w1',
    profileId: 'pat',
    mediaItemId: 'watched',
    secondsWatched: 5400,
    isFinished: true,
  });
  await db.insert(favourite).values({ id: 'f1', profileId: 'pat', mediaItemId: 'kept' });

  return household;
};

describe('readPickedForYou', { timeout: STARTING_POSTGRES_MS }, () => {
  it('picks what is like what the profile enjoyed, leaving out what it watched or kept', async () => {
    const { db, viewer } = await aWatchingHousehold();

    const picked = await readPickedForYou({ db, viewer, index: NOTHING_KNOWN, limit: 10 });

    expect(picked.map((one) => one.id)).toEqual(['romance']);
  });

  it('takes in what the rest of the household watched beside what the profile liked', async () => {
    const { db, viewer } = await aWatchingHousehold();

    await db.insert(watchHistory).values([
      {
        id: 'w2',
        profileId: 'sam',
        mediaItemId: 'watched',
        secondsWatched: 5400,
        isFinished: true,
      },
      {
        id: 'w3',
        profileId: 'sam',
        mediaItemId: 'thriller',
        secondsWatched: 5400,
        isFinished: true,
      },
    ]);

    const picked = await readPickedForYou({ db, viewer, index: NOTHING_KNOWN, limit: 10 });

    expect(picked.map((one) => one.id)).toEqual(['romance', 'thriller']);
  });

  it('steers away from what the profile rated low', async () => {
    const { db, viewer } = await aWatchingHousehold();

    await db
      .insert(rating)
      .values({ id: 'r1', profileId: 'pat', mediaItemId: 'western', stars: 1 });
    await db.insert(mediaItem).values({
      ...aMediaItemRow('romantic-western', 'films'),
      genres: ['Romance', 'Western'],
    });

    const picked = await readPickedForYou({ db, viewer, index: NOTHING_KNOWN, limit: 10 });

    expect(picked.map((one) => one.id)).toEqual(['romance']);
  });

  it('picks nothing for somebody watching without a profile', async () => {
    const { db } = await aWatchingHousehold();

    await expect(
      readPickedForYou({
        db,
        viewer: { kind: 'account', accountId: 'account', profileId: null, isAdministrator: true },
        index: NOTHING_KNOWN,
        limit: 10,
      }),
    ).resolves.toEqual([]);
  });
});
