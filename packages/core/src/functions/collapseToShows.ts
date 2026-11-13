import type { MediaSummary } from '@ValenceContracts/schemas/Library';

import { isEarlier } from '@ValenceCore/functions/isEarlier';

/**
 * Collapses a list of files into one card per thing: a programme once rather than once per episode.
 * A page holds sixty things, and without this a single series can fill it.
 *
 * @param items - The files as the server listed them.
 * @returns One entry per film and per programme.
 */
const collapseToShows = (items: readonly MediaSummary[]): MediaSummary[] => {
  const shows = new Map<string, MediaSummary>();
  const featured: MediaSummary[] = [];

  for (const item of items) {
    const series = item.seriesId ?? item.seriesTitle ?? null;

    if (series === null) {
      featured.push(item);

      continue;
    }

    const standing = shows.get(series);

    if (standing === undefined) {
      shows.set(series, item);
      featured.push(item);

      continue;
    }

    if (isEarlier(item, standing)) {
      shows.set(series, item);

      const at = featured.indexOf(standing);

      if (at !== -1) {
        featured[at] = item;
      }
    }
  }

  return featured;
};

export { collapseToShows };
