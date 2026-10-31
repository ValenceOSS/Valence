import { and, asc, inArray, isNull } from 'drizzle-orm';
import { mediaItem } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { SUMMARY_COLUMNS } from '@ValenceServer/library/SUMMARY_COLUMNS';
import { summaryOfRow } from '@ValenceServer/library/summaryOfRow';
import { isNotATrack } from '@ValenceServer/music/isNotATrack';
import { visibleToViewer } from '@ValenceServer/visibility/visibleToViewer';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

/**
 * The cards for films, episodes and shows named by id, each under the id it was named by, a show
 * drawn by its first episode the viewer may see, as the home page draws shows, leaving out anything
 * the viewer may not see and anything unknown.
 *
 * @param db - The database.
 * @param viewer - Who is looking.
 * @param ids - The items, in order.
 * @returns Their cards, by the ids they were asked for.
 */
const readSummaries = async (
  db: AnyValenceDatabase,
  viewer: Viewer,
  ids: readonly string[],
): Promise<ReadonlyMap<string, MediaSummary>> => {
  if (ids.length === 0) {
    return new Map();
  }

  const asked = [...new Set(ids)];
  const reachable = and(
    isNull(mediaItem.extraKind),
    isNull(mediaItem.parentId),
    isNotATrack(db),
    visibleToViewer(db, viewer),
  );
  const items = await db
    .select(SUMMARY_COLUMNS)
    .from(mediaItem)
    .where(and(inArray(mediaItem.id, asked), reachable));
  const found = new Map(items.map((row) => [row.id, summaryOfRow(row)]));
  const shows = asked.filter((id) => !found.has(id));
  const episodes =
    shows.length === 0
      ? []
      : await db
          .select(SUMMARY_COLUMNS)
          .from(mediaItem)
          .where(and(inArray(mediaItem.seriesId, shows), reachable))
          .orderBy(asc(mediaItem.seasonNumber), asc(mediaItem.episodeNumber), asc(mediaItem.id));

  for (const episode of episodes) {
    if (episode.seriesId !== null && !found.has(episode.seriesId)) {
      found.set(episode.seriesId, summaryOfRow(episode));
    }
  }

  return found;
};

export { readSummaries };
