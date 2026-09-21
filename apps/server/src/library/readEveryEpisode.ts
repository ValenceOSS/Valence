import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type EpisodePage = { items: MediaSummary[]; total: number };

type ReadEveryEpisodeOptions = {
  readPage: (limit: number, offset: number) => Promise<EpisodePage | null>;
  pageSize: number;
};

/**
 * Reads every episode a library has, a page at a time, however many that is.
 *
 * A library's programmes are worked out from its episodes, so reading only the first so many left
 * every programme past that point out of the Shows page altogether, and made the ones that were
 * partly inside it report only the episodes that were. It reads until it has as many as the library
 * says it holds, and stops early on an empty page rather than asking for ever if the count and the
 * rows disagree.
 *
 * @param readPage - How to read one page of episodes.
 * @param pageSize - How many to ask for at a time.
 * @returns Every episode, or null where the library is not one the viewer can see.
 */
const readEveryEpisode = async ({
  readPage,
  pageSize,
}: ReadEveryEpisodeOptions): Promise<MediaSummary[] | null> => {
  const first = await readPage(pageSize, 0);

  if (first === null) {
    return null;
  }

  const episodes = [...first.items];

  while (episodes.length < first.total) {
    const next = await readPage(pageSize, episodes.length);

    if (next === null || next.items.length === 0) {
      break;
    }

    episodes.push(...next.items);
  }

  return episodes;
};

export type { EpisodePage, ReadEveryEpisodeOptions };

export { readEveryEpisode };
