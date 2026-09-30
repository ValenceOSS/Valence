import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { findSiblings } from '@ValenceClient/library/pickFeatured';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Finds the other episodes of the season an episode belongs to, in the order they are watched. Asks
 * the library for the whole programme, since what this screen happens to have loaded is usually one
 * episode of it — a home shelf shows a programme by a single episode — and answers from what is
 * loaded only until the programme arrives.
 *
 * An episode read on its own can arrive without the id of the programme it belongs to, only its
 * name, so the programme is then found in the library's list by that name rather than guessed at.
 *
 * @param media - The episode being looked at, or null where nothing is.
 * @param known - Everything already loaded.
 * @returns The rest of its season, or nothing for a film.
 */
const useSeasonMates = (media: MediaSummary | null, known: MediaSummary[]): MediaSummary[] => {
  const series = media?.seriesTitle ?? null;
  const libraryId = media === null || series === null ? null : media.libraryId;
  const listed = useQuery({
    ...libraryQueries.shows(libraryId),
    enabled: libraryId !== null && (media?.seriesId ?? null) === null,
  });
  const showId = media?.seriesId ?? listed.data?.find((show) => show.title === series)?.id ?? null;
  const asked = useQuery(libraryQueries.show(showId === null ? null : libraryId, showId));

  if (media === null || series === null) {
    return [];
  }

  const season = asked.data?.seasons.find(
    (one) => (one.seasonNumber ?? null) === (media.seasonNumber ?? null),
  );

  return findSiblings(season === undefined ? known : season.episodes, media);
};

export { useSeasonMates };
