/* oxlint-disable valence/no-hard-coded-strings -- file and folder names on disk, which media servers read in English */
import { join } from 'node:path';
import { safeFileName } from '@ValenceCore/functions/safeFileName';
import type { PatternFile } from '@ValenceServer/rename/PatternFile.types';

/**
 * Two digits at least, as seasons and episodes are numbered in names.
 *
 * @param value - The number.
 * @returns It padded.
 */
const twoDigits = (value: number): string => value.toString().padStart(2, '0');

/**
 * A title named with its year, as its folder and its file are.
 *
 * @param title - The title.
 * @param year - Its year, where known.
 * @returns The name, safe for any disk.
 */
const namedWithYear = (title: string, year: number | null): string =>
  safeFileName(year === null ? title : `${title} (${year.toString()})`);

/**
 * Where a file belongs under the library's naming pattern, the one Valence files requests by and
 * Jellyfin, Plex and Emby read: a film as its title and year inside a folder of the same name, a
 * further version of it with its name after a dash, and an episode inside its show's folder and its
 * season's, named for its show, its season and episode, and its title. The catalogue number a
 * folder carries goes on the folder again, never on the file.
 *
 * @param file - The file, and what it is.
 * @returns Its path under the pattern.
 */
const patternPathOf = (file: PatternFile): string => {
  const tagged = (name: string) => (file.idTag === null ? name : `${name} ${file.idTag}`);

  if (file.series === null) {
    const named = namedWithYear(file.title, file.year);
    const label = file.versionLabel === null ? '' : safeFileName(file.versionLabel);

    return join(
      file.libraryPath,
      tagged(named),
      `${named}${label === '' ? '' : ` - ${label}`}.${file.extension}`,
    );
  }

  const { series } = file;
  const show = namedWithYear(series.title, series.year);
  const numbered = `S${twoDigits(series.season)}E${twoDigits(series.episode)}${
    series.lastEpisode !== null && series.lastEpisode > series.episode
      ? `-E${twoDigits(series.lastEpisode)}`
      : ''
  }`;
  const title = safeFileName(file.title);

  return join(
    file.libraryPath,
    tagged(show),
    `Season ${twoDigits(series.season)}`,
    `${show} - ${numbered}${title === '' ? '' : ` - ${title}`}.${file.extension}`,
  );
};

export { patternPathOf };
