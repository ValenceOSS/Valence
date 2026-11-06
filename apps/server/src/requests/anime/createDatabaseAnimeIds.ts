import { and, asc, eq, inArray, isNotNull, isNull, lt, or } from 'drizzle-orm';
import { library, series, titleEdit } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

type AnimeIds = { anilistId: number | null; malId: number | null };

/**
 * Where the anime libraries' series keep their AniList and MyAnimeList ids: those with a catalogue
 * id never looked up, or not since a given moment, the longest waiting first; and keeping the ids
 * found for one, or that none were, and when, never over an id an administrator set by hand.
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
    const [held] = await db
      .select({ libraryId: series.libraryId, externalId: series.externalId })
      .from(series)
      .where(eq(series.id, id))
      .limit(1);
    const edited =
      held === undefined || held.externalId === null
        ? []
        : await db
            .select({ field: titleEdit.field })
            .from(titleEdit)
            .where(
              and(
                eq(titleEdit.libraryId, held.libraryId),
                eq(titleEdit.subjectKey, `tv:${held.externalId}`),
                inArray(titleEdit.field, ['anilistId', 'malId']),
              ),
            );
    const isEdited = (field: string) => edited.some((one) => one.field === field);

    await db
      .update(series)
      .set({
        ...(isEdited('anilistId') ? {} : { anilistId: ids.anilistId }),
        ...(isEdited('malId') ? {} : { malId: ids.malId }),
        animeIdsCheckedAt: at,
      })
      .where(eq(series.id, id));
  },
});

export type { AnimeIds };

export { createDatabaseAnimeIds };
