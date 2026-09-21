import type { Metadata } from '@ValenceServer/library/MetadataProvider';

type ReleaseDetail = {
  release_date?: string | undefined;
  first_air_date?: string | undefined;
  budget?: number | undefined;
  revenue?: number | undefined;
  status?: string | undefined;
  imdb_id?: string | null | undefined;
};

/**
 * What the catalogue says about when something came out and what it made of itself: its release date
 * — or the day an episode aired — its budget and revenue, whether it is finished, and its id on the
 * other big film database.
 *
 * A budget or revenue of nothing is left out rather than kept, since the catalogue says zero for
 * "nobody knows" as often as for "it cost nothing", and a page that shows nought dollars is wrong
 * more often than it is right. A blank date or status is left out for the same reason.
 *
 * @param detail - What the catalogue answered about the title.
 * @param airDate - The day this episode aired, where the file is an episode.
 * @returns The facts it had, and only those.
 */
const releaseFactsOf = (
  detail: ReleaseDetail,
  airDate: string | null,
): Pick<Metadata, 'releaseDate' | 'budget' | 'revenue' | 'status' | 'imdbId'> => {
  const released = airDate ?? detail.release_date ?? detail.first_air_date ?? '';

  return {
    ...(released === '' ? {} : { releaseDate: released }),
    ...(detail.budget === undefined || detail.budget <= 0 ? {} : { budget: detail.budget }),
    ...(detail.revenue === undefined || detail.revenue <= 0 ? {} : { revenue: detail.revenue }),
    ...(detail.status === undefined || detail.status === '' ? {} : { status: detail.status }),
    ...(detail.imdb_id === undefined || detail.imdb_id === null || detail.imdb_id === ''
      ? {}
      : { imdbId: detail.imdb_id }),
  };
};

export { releaseFactsOf };
