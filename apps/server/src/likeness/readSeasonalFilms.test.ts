import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { mediaItem, viewerProfile } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { indexLikeness } from './indexLikeness';
import type { Likeness, TitleKind } from './Likeness';
import { readSeasonalFilms } from './readSeasonalFilms';
import { OCCASION_KEYWORDS } from '@ValenceServer/library/OCCASION_KEYWORDS';

const STARTING_POSTGRES_MS = 60_000;

/**
 * What a title is like, given only its keywords.
 *
 * @param keywords - Its keywords.
 * @returns What it is like.
 */
const keyedBy = (...keywords: number[]): Likeness => ({
  genres: [],
  keywords,
  cast: [],
  crew: [],
  recommendations: [],
});

/**
 * Says what a title is like, as the catalogue would have.
 *
 * @param kind - Whether it is a film or a programme.
 * @param catalogueId - The catalogue's identifier for it.
 * @param likeness - What it is like.
 * @returns The title.
 */
const known = (kind: TitleKind, catalogueId: string, likeness: Likeness) => ({
  kind,
  catalogueId,
  likeness,
});

const INDEX = indexLikeness([
  known('film', '100', keyedBy(OCCASION_KEYWORDS.christmas.christmas)),
  known('film', '101', keyedBy(OCCASION_KEYWORDS.christmas.santaClaus, 42)),
  known('film', '102', keyedBy(OCCASION_KEYWORDS.halloween.halloween)),
  known('film', '103', keyedBy(42)),
  known('series', '104', keyedBy(OCCASION_KEYWORDS.christmas.christmas)),
]);

/**
 * A household holding Christmas films, a Halloween film, a film of neither season, and a programme
 * the catalogue ties to Christmas.
 *
 * @returns The household.
 */
const aFestiveHousehold = async () => {
  const household = await aHousehold();

  await household.db.insert(mediaItem).values([
    { ...aMediaItemRow('elf', 'films'), externalId: '100', rating: 6.5 },
    { ...aMediaItemRow('elf-4k', 'films'), externalId: '100', rating: 6.5 },
    { ...aMediaItemRow('santa', 'films'), externalId: '101', rating: 8 },
    { ...aMediaItemRow('pumpkin', 'films'), externalId: '102', rating: 9 },
    { ...aMediaItemRow('plain', 'films'), externalId: '103', rating: 9 },
    { ...aMediaItemRow('special', 'films'), externalId: '104', seriesTitle: 'A Show' },
  ]);

  return household;
};

describe('readSeasonalFilms', { timeout: STARTING_POSTGRES_MS }, () => {
  it('reads the films of the season, best rated first, each film once', async () => {
    const { db, viewer } = await aFestiveHousehold();

    const films = await readSeasonalFilms({
      db,
      viewer,
      index: INDEX,
      season: 'christmas',
      limit: 10,
    });

    expect(films.map((film) => film.id)).toStrictEqual(['santa', 'elf']);
  });

  it('reads another season by its own keywords', async () => {
    const { db, viewer } = await aFestiveHousehold();

    const films = await readSeasonalFilms({
      db,
      viewer,
      index: INDEX,
      season: 'halloween',
      limit: 10,
    });

    expect(films.map((film) => film.id)).toStrictEqual(['pumpkin']);
  });

  it('takes no more than asked for', async () => {
    const { db, viewer } = await aFestiveHousehold();

    const films = await readSeasonalFilms({
      db,
      viewer,
      index: INDEX,
      season: 'christmas',
      limit: 1,
    });

    expect(films.map((film) => film.id)).toStrictEqual(['santa']);
  });

  it('reads nothing for a profile that turned the seasonal rows off', async () => {
    const { db, viewer } = await aFestiveHousehold();

    await db
      .update(viewerProfile)
      .set({ showsSeasonalRows: false })
      .where(eq(viewerProfile.id, 'pat'));

    const films = await readSeasonalFilms({
      db,
      viewer,
      index: INDEX,
      season: 'christmas',
      limit: 10,
    });

    expect(films).toStrictEqual([]);
  });

  it('reads the films for somebody watching without a profile', async () => {
    const { db } = await aFestiveHousehold();

    const films = await readSeasonalFilms({
      db,
      viewer: { kind: 'account', accountId: 'account', profileId: null, isAdministrator: true },
      index: INDEX,
      season: 'christmas',
      limit: 10,
    });

    expect(films).toHaveLength(2);
  });
});
