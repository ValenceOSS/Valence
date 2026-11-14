import { and, desc, isNotNull, isNull, ne, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { mediaItem } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { jsonContains } from '@ValenceDatabase/jsonContains';
import { nullsLast } from '@ValenceDatabase/nullsLast';
import { isNotATrack } from '@ValenceServer/music/isNotATrack';
import { visibleToViewer } from '@ValenceServer/visibility/visibleToViewer';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

type SharingGenres = { id: string; shared: number; rating: number | null };

type GenreSource = { id: string; seriesId: string | null; genres: readonly string[] };

const FEWEST_SHARED = 2;

/**
 * Finds the films and programmes a viewer may see that share at least two genres with a title, most
 * shared first and the better rated first among equals, a film by its own id and a programme by its
 * show's id.
 *
 * @param db - The database.
 * @param viewer - Who is looking.
 * @param source - The film, or any episode of the programme, and its genres.
 * @param limit - How many to take.
 * @returns The titles, most alike first.
 */
const listSharingGenres = async (
  db: AnyValenceDatabase,
  viewer: Viewer,
  source: GenreSource,
  limit: number,
): Promise<SharingGenres[]> => {
  const genres = [...new Set(source.genres)];

  if (genres.length < FEWEST_SHARED || limit <= 0) {
    return [];
  }

  const shared: SQL<number> = sql<number>`(${sql.join(
    genres.map(
      (genre) => sql`case when ${jsonContains(mediaItem.genres, [genre])} then 1 else 0 end`,
    ),
    sql` + `,
  )})`;
  const alike = and(
    isNull(mediaItem.extraKind),
    isNull(mediaItem.parentId),
    isNotNull(mediaItem.genres),
    isNotATrack(db),
    visibleToViewer(db, viewer),
    sql`${shared} >= ${FEWEST_SHARED}`,
  );

  const films = await db
    .select({
      id: mediaItem.id,
      shared: shared.mapWith(Number),
      rating: mediaItem.rating,
    })
    .from(mediaItem)
    .where(and(alike, isNull(mediaItem.seriesTitle), ne(mediaItem.id, source.id)))
    .orderBy(desc(shared), nullsLast(mediaItem.rating, 'desc'), mediaItem.id)
    .limit(limit);

  const mostShared = sql<number>`max(${shared})`.mapWith(Number);
  const bestRated = sql<number | null>`max(${mediaItem.rating})`;
  const shows = await db
    .select({ seriesId: mediaItem.seriesId, shared: mostShared, rating: bestRated })
    .from(mediaItem)
    .where(
      and(
        alike,
        isNotNull(mediaItem.seriesTitle),
        isNotNull(mediaItem.seriesId),
        source.seriesId === null ? undefined : ne(mediaItem.seriesId, source.seriesId),
      ),
    )
    .groupBy(mediaItem.seriesId)
    .orderBy(desc(mostShared), nullsLast(bestRated, 'desc'), mediaItem.seriesId)
    .limit(limit);

  return [
    ...films,
    ...shows.flatMap((show) =>
      show.seriesId === null
        ? []
        : [{ id: show.seriesId, shared: show.shared, rating: show.rating }],
    ),
  ]
    .toSorted(
      (left, right) =>
        right.shared - left.shared ||
        (right.rating ?? -1) - (left.rating ?? -1) ||
        left.id.localeCompare(right.id),
    )
    .slice(0, limit);
};

export type { GenreSource, SharingGenres };

export { listSharingGenres };
