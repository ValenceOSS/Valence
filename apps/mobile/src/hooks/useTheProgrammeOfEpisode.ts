import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import type { ShowSummary } from '@ValenceContracts/schemas/Show';

/**
 * Finds the programme an episode belongs to, by its series' name in its library, since a title's
 * page knows no more of it than that.
 *
 * @param mediaId - The episode, or null where there is none.
 * @returns The programme, or null for a film or until it is found.
 */
const useTheProgrammeOfEpisode = (mediaId: string | null): ShowSummary | null => {
  const detail = useQuery({ ...libraryQueries.detail(mediaId), enabled: mediaId !== null });
  const seriesTitle = detail.data?.metadata.seriesTitle ?? null;
  const programmes = useQuery({
    ...libraryQueries.shows(detail.data?.libraryId ?? null),
    enabled: seriesTitle !== null,
  });

  return (programmes.data ?? []).find((one) => one.title === seriesTitle) ?? null;
};

export { useTheProgrammeOfEpisode };
