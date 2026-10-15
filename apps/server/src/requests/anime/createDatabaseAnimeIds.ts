import { and, asc, eq, isNotNull, isNull, lt, or } from 'drizzle-orm';
import { library, series } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

type AnimeIds = { anilistId: number | null; malId: number | null };

/**
 * Where the anime libraries' series keep their AniList and MyAnimeList ids: those with a catalogue
 * id never looked up, or not since a given moment, the longest waiting first; and keeping the ids
 * found for one, or that none were, and when.
 *
 * @param db - The database.
 * @returns How to list them and keep what was found.
 */
const createDatabaseAnimeIds = (db: AnyValenceDatabase) => ({
  unchecked: async (before: Date, most: number): Promise<{ id: string; tmdbId: string }[]> => {
    const rows = await db
      .select({ id: series.id, tmdbId: series.externalId })
      .from(series)
      .innerJoin(library, eq(library.id, series.libraryId))
      .where(
        and(
          eq(library.kind, 'anime'),
          isNotNull(series.externalId),
          or(isNull(series.animeIdsCheckedAt), lt(series.animeIdsCheckedAt, before)),
        ),
      )
      .orderBy(asc(series.animeIdsCheckedAt), asc(series.id))
      .limit(most);

    return rows.flatMap(({ id, tmdbId }) =>
      tmdbId === null || !/^\d+$/.test(tmdbId) ? [] : [{ id, tmdbId }],
    );
  },

  keep: async (id: string, ids: AnimeIds, at: Date): Promise<void> => {
    await db
      .update(series)
      .set({ anilistId: ids.anilistId, malId: ids.malId, animeIdsCheckedAt: at })
      .where(eq(series.id, id));
  },
});

export type { AnimeIds };

export { createDatabaseAnimeIds };
