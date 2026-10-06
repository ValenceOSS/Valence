import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Finds every episode of the programme an episode belongs to, across all its seasons. Asks the
 * library for the whole programme, since what this screen happens to have loaded is usually one
 * episode of it — a home shelf shows a programme by a single episode — and answers from what is
 * loaded only until the programme arrives.
 *
 * An episode read on its own can arrive without the id of the programme it belongs to, only its
 * name, so the programme is then found in the library's list by that name rather than guessed at.
 *
 * @param media - The episode being looked at, or null where nothing is.
 * @param known - Everything already loaded.
 * @returns Every episode of its programme, itself included, or nothing for a film.
 */
const useShowEpisodes = (media: MediaSummary | null, known: MediaSummary[]): MediaSummary[] => {
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

  return asked.data === undefined || asked.data === null
    ? known.filter((item) => item.seriesTitle === series)
    : asked.data.seasons.flatMap((season) => season.episodes);
};

export { useShowEpisodes };
