import { asc } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { mediaItem, titleLikeness } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { isForAnOccasion } from './isForAnOccasion';
import { OCCASION_KEYWORDS } from './OCCASION_KEYWORDS';

const STARTING_POSTGRES_MS = 60_000;

/**
 * What the catalogue said a title is like, given only its keywords.
 *
 * @param kind - Whether it is a film or a programme.
 * @param catalogueId - The catalogue's identifier for it.
 * @param keywordIds - Its keywords.
 * @returns The row.
 */
const likeness = (kind: string, catalogueId: string, keywordIds: number[]) => ({
  kind,
  catalogueId,
  genreIds: [],
  keywordIds,
  castIds: [],
  crewIds: [],
  recommendedIds: [],
});

/**
 * A household holding a Christmas film, an Easter film, a film of no occasion, and an episode of a
 * programme the catalogue ties to Christmas.
 *
 * @returns The database.
 */
const aFestiveHousehold = async () => {
  const { db } = await aHousehold();

  await db.insert(mediaItem).values([
    { ...aMediaItemRow('festive', 'films'), externalId: '100' },
    { ...aMediaItemRow('bunny', 'films'), externalId: '101' },
    { ...aMediaItemRow('plain', 'films'), externalId: '102' },
    { ...aMediaItemRow('special', 'films'), externalId: '103', seriesTitle: 'A Show' },
  ]);
  await db
    .insert(titleLikeness)
    .values([
      likeness('film', '100', [42, OCCASION_KEYWORDS.christmas.santaClaus]),
      likeness('film', '101', [OCCASION_KEYWORDS.easter.easterBunny]),
      likeness('film', '102', [42]),
      likeness('series', '103', [OCCASION_KEYWORDS.christmas.christmas]),
    ]);

  return db;
};

describe('isForAnOccasion', { timeout: STARTING_POSTGRES_MS }, () => {
  it('keeps the films tied to any of the occasions, by any of their keywords', async () => {
    const db = await aFestiveHousehold();
    const ids = async (occasions: Parameters<typeof isForAnOccasion>[1]) =>
      (
        await db
          .select({ id: mediaItem.id })
          .from(mediaItem)
          .where(isForAnOccasion(db, occasions))
          .orderBy(asc(mediaItem.id))
      ).map((row) => row.id);

    expect(await ids(['christmas'])).toEqual(['festive']);
    expect(await ids(['christmas', 'easter'])).toEqual(['bunny', 'festive']);
    expect(await ids(['halloween'])).toEqual([]);
  });
});
