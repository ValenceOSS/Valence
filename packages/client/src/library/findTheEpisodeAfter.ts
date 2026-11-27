import type { QueryClient } from '@tanstack/react-query';
import { nextEpisode } from '@ValenceCore/functions/nextEpisode';
import { findAShow } from '@ValenceClient/library/findAShow';
import { showIdOf } from '@ValenceClient/library/showIdOf';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { Viewing } from '@ValenceContracts/schemas/Viewing';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

/**
 * Finds the episode to watch after one somebody watched, passing over any they have already
 * finished, as continue watching does.
 *
 * @param cache - Where what has been read is kept.
 * @param watched - The episode watched, and the programme it belongs to.
 * @param progress - How far through each thing this viewer is.
 * @returns The next episode, or null for a film, a programme no library holds, or a last episode.
 */
const findTheEpisodeAfter = async (
  cache: QueryClient,
  watched: Pick<Viewing, 'mediaItemId' | 'seriesId' | 'seriesTitle'>,
  progress: ReadonlyMap<string, WatchProgress>,
): Promise<MediaSummary | null> => {
  const showId = showIdOf(watched);
  const show = showId === null ? null : await findAShow(cache, showId);

  if (show === null) {
    return null;
  }

  const detail = await cache.ensureQueryData(libraryQueries.show(show.libraryId, show.id));
  const episodes = detail?.seasons.flatMap((season) => season.episodes) ?? [];
  const from = episodes.find((episode) => episode.id === watched.mediaItemId);
  let next = from === undefined ? null : nextEpisode(episodes, from);

  while (next !== null && progress.get(next.id)?.isFinished === true) {
    next = nextEpisode(episodes, next);
  }

  return next;
};

export { findTheEpisodeAfter };
