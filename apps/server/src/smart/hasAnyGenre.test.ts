import { describe, expect, it } from 'vitest';
import { mediaItem } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { hasAnyGenre } from './hasAnyGenre';

const STARTING_POSTGRES_MS = 60_000;

/**
 * A household with a comedy, a drama and a film with no genres, and a way to ask which keep a
 * genre rule.
 *
 * @returns How to ask.
 */
const aShelf = async () => {
  const { db } = await aHousehold();

  await db.insert(mediaItem).values([
    { ...aMediaItemRow('comedy', 'films'), genres: ['Comedy'] },
    { ...aMediaItemRow('drama', 'films'), genres: ['Drama'] },
    { ...aMediaItemRow('none', 'films'), genres: null },
  ]);

  return async (anyOf: string[], isNegated: boolean) =>
    (
      await db
        .select({ id: mediaItem.id })
        .from(mediaItem)
        .where(hasAnyGenre(mediaItem.genres, anyOf, isNegated))
    )
      .map((row) => row.id)
      .sort();
};

describe('hasAnyGenre', { timeout: STARTING_POSTGRES_MS }, () => {
  it('keeps what has one of the genres asked for', async () => {
    const asked = await aShelf();

    await expect(asked(['Comedy', 'Drama'], false)).resolves.toEqual(['comedy', 'drama']);
  });

  it('keeps what has none of them, a title with no genres at all among them', async () => {
    const asked = await aShelf();

    await expect(asked(['Comedy'], true)).resolves.toEqual(['drama', 'film', 'none']);
  });
});
