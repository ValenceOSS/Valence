/* oxlint-disable valence/no-hard-coded-strings -- folder names on disk, which media servers read in English */
import { basename, join } from 'node:path';
import type { SeasonFolder } from '@ValenceContracts/schemas/MediaRequest';

const SEASON_FOLDER = /^(?<word>season\s*)(?<number>\d+)$/iu;

/**
 * The folder an episode of a season goes in: the one the library already keeps that season in,
 * loose episodes and all, or else a folder of its own inside the series' folder, named the way the
 * series' other season folders are named and `Season 01` where it has none.
 *
 * @param seriesFolder - The series' folder.
 * @param season - The season.
 * @param seasonFolders - Where the library keeps each season it holds.
 * @returns The folder.
 */
const seasonFolderOf = (
  seriesFolder: string,
  season: number,
  seasonFolders: readonly SeasonFolder[],
): string => {
  const kept = seasonFolders.find((one) => one.season === season);

  if (kept !== undefined) {
    return kept.folder;
  }

  const named = seasonFolders.flatMap((one) => {
    const groups = SEASON_FOLDER.exec(basename(one.folder))?.groups;

    return groups?.word === undefined || groups.number === undefined ? [] : [groups];
  });
  const word = named[0]?.word ?? 'Season ';
  const isPadded = !named.some((one) => one.number?.length === 1);

  return join(
    seriesFolder,
    `${word}${isPadded ? season.toString().padStart(2, '0') : season.toString()}`,
  );
};

export { seasonFolderOf };
