import type { BorrowedSeason } from './MetadataProvider';
import type { SeasonSourceRow } from './SeasonSourceRow.types';

/**
 * Says which seasons of a file's programme are read from another catalogue entry, where somebody
 * said a season is another entry's, such as a revival the catalogue keeps as a show of its own
 * while the files carry on the old show's numbering. The programme itself stays the one it is
 * matched to.
 *
 * @param sources - The seasons read from elsewhere in the file's library.
 * @param folder - The file's programme's folder, where it is an episode of one.
 * @returns The programme's seasons read from elsewhere, or nothing where it has none.
 */
const borrowedSeasonsIn = (
  sources: readonly SeasonSourceRow[],
  folder: string | null | undefined,
): { borrowed?: BorrowedSeason[] } => {
  const found =
    folder === null || folder === undefined ? [] : sources.filter((one) => one.folder === folder);

  return found.length === 0
    ? {}
    : {
        borrowed: found.map((one) => ({
          seasonNumber: one.seasonNumber,
          externalId: one.externalId,
          externalSeason: one.externalSeason,
        })),
      };
};

export { borrowedSeasonsIn };
