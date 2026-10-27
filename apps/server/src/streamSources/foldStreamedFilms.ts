import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import { library, mediaItem } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { carryOverViewing } from '@ValenceServer/library/carryOverViewing';

/**
 * Hands what people watched of a film played from a source over to the same film once it arrives
 * in a library of the server's own — progress, history, favourites, ratings and the rest — and
 * forgets the streamed copy, so the film has one place in everybody's viewing and plays from the
 * file from then on.
 *
 * @param db - The database.
 * @param arrivedIds - Titles a scan has just added.
 * @returns How many streamed films were folded in.
 */
const foldStreamedFilms = async (
  db: AnyValenceDatabase,
  arrivedIds: readonly string[],
): Promise<number> => {
  if (arrivedIds.length === 0) {
    return 0;
  }

  const arrived = await db
    .select({ id: mediaItem.id, externalId: mediaItem.externalId })
    .from(mediaItem)
    .innerJoin(library, eq(library.id, mediaItem.libraryId))
    .where(
      and(
        inArray(mediaItem.id, [...arrivedIds]),
        eq(library.isStreamed, false),
        eq(library.kind, 'movies'),
        isNotNull(mediaItem.externalId),
        isNull(mediaItem.seriesId),
        isNull(mediaItem.extraKind),
        isNull(mediaItem.parentId),
      ),
    );
  const externalIds = arrived.flatMap((one) => (one.externalId === null ? [] : [one.externalId]));

  if (externalIds.length === 0) {
    return 0;
  }

  const streamed = await db
    .select({ id: mediaItem.id, externalId: mediaItem.externalId })
    .from(mediaItem)
    .innerJoin(library, eq(library.id, mediaItem.libraryId))
    .where(and(eq(library.isStreamed, true), inArray(mediaItem.externalId, externalIds)));
  const successions = streamed.flatMap((copy) => {
    const kept = arrived.find((one) => one.externalId === copy.externalId);

    return kept === undefined ? [] : [{ from: copy.id, to: kept.id }];
  });

  if (successions.length === 0) {
    return 0;
  }

  await carryOverViewing(db, successions);
  await db.delete(mediaItem).where(
    inArray(
      mediaItem.id,
      successions.map((one) => one.from),
    ),
  );

  return successions.length;
};

export { foldStreamedFilms };
