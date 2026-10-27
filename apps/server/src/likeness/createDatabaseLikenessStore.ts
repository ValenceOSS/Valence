import { and, eq, gte, inArray, isNotNull, isNull, notExists, sql } from 'drizzle-orm';
import { upsert } from '@ValenceDatabase/upsert';
import { mediaItem, titleLikeness } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { isNotATrack } from '@ValenceServer/music/isNotATrack';
import type { Likeness, TitleKind } from './Likeness';
import { titleKey } from './titleKey';

type CatalogueTitle = { kind: TitleKind; catalogueId: string };

type KnownLikeness = CatalogueTitle & { likeness: Likeness };

const CATALOGUE_ID = /^\d+$/;

const FORGOTTEN_AT_ONCE = 500;

/**
 * Where what each title is like is kept, by the catalogue's own identifier for it: the films and
 * programmes in the libraries that have not been read since a given moment, keeping what was read,
 * and forgetting titles no library holds any longer.
 *
 * @param db - The database.
 * @returns How to list what is waiting, keep what was read, forget what is gone and read it all back.
 */
const createDatabaseLikenessStore = (db: AnyValenceDatabase) => {
  /**
   * Lists the titles of one kind the libraries hold whose likeness is missing or older than a moment.
   *
   * @param kind - Films or programmes.
   * @param before - The moment a reading has to be newer than to stand.
   * @returns The titles.
   */
  const waitingOf = async (kind: TitleKind, before: Date): Promise<CatalogueTitle[]> => {
    const rows = await db
      .selectDistinct({ catalogueId: mediaItem.externalId })
      .from(mediaItem)
      .where(
        and(
          isNotNull(mediaItem.externalId),
          kind === 'film' ? isNull(mediaItem.seriesTitle) : isNotNull(mediaItem.seriesTitle),
          isNull(mediaItem.extraKind),
          isNull(mediaItem.parentId),
          isNull(mediaItem.missingSince),
          isNotATrack(db),
          notExists(
            db
              .select({ one: sql`1` })
              .from(titleLikeness)
              .where(
                and(
                  eq(titleLikeness.kind, kind),
                  eq(titleLikeness.catalogueId, mediaItem.externalId),
                  gte(titleLikeness.readAt, before),
                ),
              ),
          ),
        ),
      );

    return rows.flatMap(({ catalogueId }) =>
      catalogueId === null || !CATALOGUE_ID.test(catalogueId) ? [] : [{ kind, catalogueId }],
    );
  };

  return {
    waiting: async (before: Date): Promise<CatalogueTitle[]> => [
      ...(await waitingOf('film', before)),
      ...(await waitingOf('series', before)),
    ],

    keep: async (title: CatalogueTitle, likeness: Likeness, at: Date): Promise<void> => {
      const read = {
        genreIds: likeness.genres,
        keywordIds: likeness.keywords,
        castIds: likeness.cast,
        crewIds: likeness.crew,
        recommendedIds: likeness.recommendations,
        readAt: at,
      };

      await upsert(db, titleLikeness, {
        values: [{ kind: title.kind, catalogueId: title.catalogueId, ...read }],
        target: [titleLikeness.kind, titleLikeness.catalogueId],
        set: read,
      });
    },

    forgetUnheld: async (): Promise<void> => {
      const held = await db
        .selectDistinct({ externalId: mediaItem.externalId, seriesTitle: mediaItem.seriesTitle })
        .from(mediaItem)
        .where(isNotNull(mediaItem.externalId));
      const holding = new Set(
        held.map(({ externalId, seriesTitle }) =>
          titleKey(seriesTitle === null ? 'film' : 'series', externalId ?? ''),
        ),
      );
      const kept = await db
        .select({ kind: titleLikeness.kind, catalogueId: titleLikeness.catalogueId })
        .from(titleLikeness);

      for (const kind of ['film', 'series'] as const) {
        const gone = kept
          .filter((one) => one.kind === kind && !holding.has(titleKey(kind, one.catalogueId)))
          .map((one) => one.catalogueId);

        for (let at = 0; at < gone.length; at += FORGOTTEN_AT_ONCE) {
          await db
            .delete(titleLikeness)
            .where(
              and(
                eq(titleLikeness.kind, kind),
                inArray(titleLikeness.catalogueId, gone.slice(at, at + FORGOTTEN_AT_ONCE)),
              ),
            );
        }
      }
    },

    readAll: async (): Promise<KnownLikeness[]> => {
      const rows = await db.select().from(titleLikeness);

      return rows.flatMap((row) =>
        row.kind === 'film' || row.kind === 'series'
          ? [
              {
                kind: row.kind,
                catalogueId: row.catalogueId,
                likeness: {
                  genres: row.genreIds,
                  keywords: row.keywordIds,
                  cast: row.castIds,
                  crew: row.crewIds,
                  recommendations: row.recommendedIds,
                },
              },
            ]
          : [],
      );
    },
  };
};

type LikenessStore = ReturnType<typeof createDatabaseLikenessStore>;

export type { CatalogueTitle, KnownLikeness, LikenessStore };

export { createDatabaseLikenessStore };
