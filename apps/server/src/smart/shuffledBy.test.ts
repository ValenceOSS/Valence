import { asc } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { library, mediaItem } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { shuffledBy } from './shuffledBy';

const STARTING_POSTGRES_MS = 60_000;

/**
 * The order a shuffle puts a dozen films in, for one list on one day.
 *
 * @param listId - The list.
 * @param day - The day, as a moment on it.
 * @returns The films' ids, in order.
 */
const aDozen = async () => {
  const { db } = await aHousehold();

  await db.insert(library).values({ id: 'more', name: 'More', kind: 'movies', path: '/more' });
  await db
    .insert(mediaItem)
    .values(Array.from({ length: 12 }, (_none, at) => aMediaItemRow(`film-${String(at)}`, 'more')));

  return async (listId: string, day: string) =>
    (
      await db
        .select({ id: mediaItem.id })
        .from(mediaItem)
        .orderBy(asc(shuffledBy(mediaItem.id, listId, new Date(day))))
    ).map((row) => row.id);
};

describe('shuffledBy', { timeout: STARTING_POSTGRES_MS }, () => {
  it('shuffles the same way all day, another way the next day and for another list', async () => {
    const order = await aDozen();
    const morning = await order('list', '2026-10-27T08:00:00.000Z');

    await expect(order('list', '2026-10-27T22:00:00.000Z')).resolves.toEqual(morning);
    await expect(order('list', '2026-10-28T08:00:00.000Z')).resolves.not.toEqual(morning);
    await expect(order('other', '2026-10-27T08:00:00.000Z')).resolves.not.toEqual(morning);
  });
});
