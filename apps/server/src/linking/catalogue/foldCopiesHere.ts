import { and, eq, isNotNull, isNull, or } from 'drizzle-orm';
import { library, mediaItem, series } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

/**
 * Makes each title a linked library shares that this server already has — the same film by its
 * catalogue or IMDb id, the same episode by its programme's id, season and number — another copy of
 * this server's own rather than a card of its own: one card, with every copy in its versions, each
 * named by its picture and the server it is on. This server's own copy stays the one played unless
 * somebody chooses another, since it costs nothing upstream and plays while the other is away.
 *
 * @param db - The database.
 * @param libraryId - The linked library, as this server keeps it.
 * @param serverName - What the server it comes from is called.
 * @returns How many titles became copies of this server's own.
 */
const foldCopiesHere = async (
  db: AnyValenceDatabase,
  libraryId: string,
  serverName: string,
): Promise<number> => {
  const [shelf] = await db
    .select({ kind: library.kind })
    .from(library)
    .where(eq(library.id, libraryId));

  if (
    shelf === undefined ||
    (shelf.kind !== 'movies' && shelf.kind !== 'shows' && shelf.kind !== 'anime')
  ) {
    return 0;
  }

  const isEpisodic = shelf.kind !== 'movies';

  const theirs = await db
    .select({
      id: mediaItem.id,
      externalId: mediaItem.externalId,
      imdbId: mediaItem.imdbId,
      height: mediaItem.height,
      seasonNumber: mediaItem.seasonNumber,
      episodeNumber: mediaItem.episodeNumber,
      seriesExternalId: series.externalId,
    })
    .from(mediaItem)
    .leftJoin(series, eq(series.id, mediaItem.seriesId))
    .where(
      and(
        eq(mediaItem.libraryId, libraryId),
        isNull(mediaItem.parentId),
        isNull(mediaItem.extraKind),
      ),
    );

  const ours = await db
    .select({
      id: mediaItem.id,
      externalId: mediaItem.externalId,
      imdbId: mediaItem.imdbId,
      seasonNumber: mediaItem.seasonNumber,
      episodeNumber: mediaItem.episodeNumber,
      seriesExternalId: series.externalId,
    })
    .from(mediaItem)
    .innerJoin(library, eq(library.id, mediaItem.libraryId))
    .leftJoin(series, eq(series.id, mediaItem.seriesId))
    .where(
      and(
        isNull(library.linkedServerId),
        eq(library.kind, shelf.kind),
        isNull(mediaItem.parentId),
        isNull(mediaItem.extraKind),
        or(
          isNotNull(mediaItem.externalId),
          isNotNull(mediaItem.imdbId),
          isNotNull(series.externalId),
        ),
      ),
    );

  const episodeKey = (row: {
    seriesExternalId: string | null;
    seasonNumber: number | null;
    episodeNumber: number | null;
  }) =>
    row.seriesExternalId === null || row.seasonNumber === null || row.episodeNumber === null
      ? null
      : `${row.seriesExternalId}:${row.seasonNumber.toString()}:${row.episodeNumber.toString()}`;

  const byKey = new Map<string, string>();

  for (const row of ours) {
    for (const key of [
      isEpisodic ? episodeKey(row) : null,
      shelf.kind === 'movies' && row.externalId !== null ? `x:${row.externalId}` : null,
      shelf.kind === 'movies' && row.imdbId !== null ? `i:${row.imdbId}` : null,
    ]) {
      if (key !== null && !byKey.has(key)) {
        byKey.set(key, row.id);
      }
    }
  }

  const folds = theirs.flatMap((row) => {
    const keys = isEpisodic
      ? [episodeKey(row)]
      : [
          row.externalId === null ? null : `x:${row.externalId}`,
          row.imdbId === null ? null : `i:${row.imdbId}`,
        ];
    const here = keys.map((key) => (key === null ? undefined : byKey.get(key))).find(Boolean);

    return here === undefined ? [] : [{ id: row.id, parentId: here, height: row.height }];
  });

  for (const fold of folds) {
    await db
      .update(mediaItem)
      .set({ parentId: fold.parentId, versionLabel: `${fold.height.toString()}p · ${serverName}` })
      .where(eq(mediaItem.id, fold.id));
  }

  return folds.length;
};

export { foldCopiesHere };
