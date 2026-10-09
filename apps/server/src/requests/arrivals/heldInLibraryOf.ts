import { dirname } from 'node:path';
import type { HeldEpisode, HeldInLibrary } from '@ValenceContracts/schemas/MediaRequest';
import type { SeriesFile } from '@ValenceServer/requests/catalogue/SeriesFile';

const FOLDER_KEY = 'folder:';

/**
 * Every episode the files hold, a double episode counting as each of the episodes it spans, each
 * once however many copies there are.
 *
 * @param files - The files.
 * @returns The episodes.
 */
const episodesIn = (files: readonly SeriesFile[]): HeldEpisode[] => {
  const seen = new Map<string, HeldEpisode>();

  for (const { season, episode, lastEpisode } of files) {
    const through = lastEpisode !== null && lastEpisode > episode ? lastEpisode : episode;

    for (let number = episode; number <= through; number += 1) {
      seen.set(`${season.toString()}x${number.toString()}`, { season, episode: number });
    }
  }

  return [...seen.values()].toSorted(
    (left, right) => left.season - right.season || left.episode - right.episode,
  );
};

/**
 * The value held most often, the first of those tied.
 *
 * @param values - The values.
 * @returns It, or nothing where there are none.
 */
const mostCommon = (values: readonly string[]): string | undefined => {
  const counted = new Map<string, number>();

  for (const value of values) {
    counted.set(value, (counted.get(value) ?? 0) + 1);
  }

  return [...counted].reduce<[string, number] | undefined>(
    (best, entry) => (best === undefined || entry[1] > best[1] ? entry : best),
    undefined,
  )?.[0];
};

/**
 * What a library already holds of a series, as a request for it is told: every episode any library
 * on this server holds, so none is fetched twice; the series it is there as; and, where the library
 * a request files into keeps it in a folder of its own and new episodes are kept with it, that
 * folder and the folder each season is in — loose in the series' folder or a season folder inside
 * it, whichever most of the season's episodes are in.
 *
 * Where a library holds a series twice over, as when an earlier request filed it beside a folder it
 * already had, the copy with the most episodes is the one kept to.
 *
 * @param files - Every episode file of the series on this server.
 * @param libraryId - The library a request files into.
 * @param keepsShowsTogether - Whether that library files new episodes with the ones it holds.
 * @returns What it holds.
 */
const heldInLibraryOf = (
  files: readonly SeriesFile[],
  libraryId: string,
  keepsShowsTogether: boolean,
): HeldInLibrary => {
  const here = files.filter((file) => file.libraryId === libraryId);
  const seriesId =
    mostCommon(here.map((file) => file.seriesId)) ?? mostCommon(files.map((file) => file.seriesId));
  const kept = here.filter((file) => file.seriesId === seriesId);
  const key = kept[0]?.seriesKey ?? '';
  const folder =
    keepsShowsTogether && key.startsWith(FOLDER_KEY) ? key.slice(FOLDER_KEY.length) : null;
  const seasons = [...new Set(kept.map((file) => file.season))].toSorted(
    (left, right) => left - right,
  );

  return {
    mediaId: seriesId ?? null,
    episodes: episodesIn(files),
    folder,
    seasonFolders:
      folder === null
        ? []
        : seasons.flatMap((season) => {
            const inSeason = mostCommon(
              kept
                .filter((file) => file.season === season)
                .map((file) => dirname(file.path))
                .filter((parent) => parent === folder || parent.startsWith(`${folder}/`)),
            );

            return inSeason === undefined ? [] : [{ season, folder: inSeason }];
          }),
  };
};

export { heldInLibraryOf };
