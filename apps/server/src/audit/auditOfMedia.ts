import type { MediaDetail } from '@ValenceContracts/schemas/Library';

/**
 * Names a film or an episode for the audit log the way somebody reading it would look for it: by
 * the film, or by the programme with the season and episode beside it, and the library it is in.
 *
 * @param item - The item.
 * @param libraryName - The library it is in, where that is known.
 * @returns What the entry is about, and what else identifies it.
 */
const auditOfMedia = (
  item: MediaDetail,
  libraryName: string | null,
): { target: string; detail: Record<string, string> } => {
  const { seriesTitle, seasonNumber, episodeNumber } = item.metadata;

  return {
    target: seriesTitle ?? item.title,
    detail: {
      ...(seriesTitle === null || seriesTitle === undefined || seriesTitle === item.title
        ? {}
        : { episodeTitle: item.title }),
      ...(item.year === null || item.year === undefined ? {} : { year: item.year.toString() }),
      ...(seasonNumber === null || seasonNumber === undefined
        ? {}
        : { season: seasonNumber.toString() }),
      ...(episodeNumber === null || episodeNumber === undefined
        ? {}
        : { episode: episodeNumber.toString() }),
      ...(item.versionLabel === null || item.versionLabel === undefined
        ? {}
        : { version: item.versionLabel }),
      ...(libraryName === null ? {} : { library: libraryName }),
    },
  };
};

export { auditOfMedia };
