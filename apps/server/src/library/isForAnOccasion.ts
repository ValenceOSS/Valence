import { and, eq, exists, isNull, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { mediaItem, titleLikeness } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { Occasion } from '@ValenceContracts/constants/OCCASIONS';
import { jsonContains } from '@ValenceDatabase/jsonContains';
import { OCCASION_KEYWORDS } from './OCCASION_KEYWORDS';

/**
 * Narrows media items to the films the catalogue ties to any of some occasions, such as Christmas,
 * by the keywords it gave each film.
 *
 * @param db - The database.
 * @param occasions - The occasions, any of which will do.
 * @returns The condition.
 */
const isForAnOccasion = (db: AnyValenceDatabase, occasions: readonly Occasion[]): SQL | undefined =>
  and(
    isNull(mediaItem.seriesTitle),
    exists(
      db
        .select({ one: sql`1` })
        .from(titleLikeness)
        .where(
          and(
            eq(titleLikeness.kind, 'film'),
            eq(titleLikeness.catalogueId, mediaItem.externalId),
            or(
              ...occasions
                .flatMap((occasion) => Object.values(OCCASION_KEYWORDS[occasion]))
                .map((keyword) => jsonContains(titleLikeness.keywordIds, [keyword])),
            ),
          ),
        ),
    ),
  );

export { isForAnOccasion };
