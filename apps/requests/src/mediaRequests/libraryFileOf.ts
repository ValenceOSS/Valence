/* oxlint-disable valence/no-hard-coded-strings -- file and folder names on disk, which media servers read in English */
import { join } from 'node:path';
import { BEING_CHECKED } from '@ValenceRequests/mediaRequests/BEING_CHECKED';
import { libraryFolderOf } from '@ValenceRequests/mediaRequests/libraryFolderOf';
import { safeFileName } from '@ValenceCore/functions/safeFileName';
import { seasonFolderOf } from '@ValenceRequests/mediaRequests/seasonFolderOf';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

/**
 * Two digits at least, as seasons and episodes are numbered in names.
 *
 * @param value - The number.
 * @returns It padded.
 */
const twoDigits = (value: number): string => value.toString().padStart(2, '0');

const MOST_NAME_BYTES = 255;

/**
 * As much of a title as fits in so many bytes once written to disk, cut at a whole character and
 * without a space left hanging at the end.
 *
 * @param title - The title.
 * @param bytes - How many bytes it may take.
 * @returns What fits, which is nothing where nothing does.
 */
const fittedTo = (title: string, bytes: number): string => {
  const encoder = new TextEncoder();

  if (encoder.encode(title).length <= bytes) {
    return title;
  }

  let kept = '';

  for (const character of title) {
    if (encoder.encode(kept + character).length > bytes) {
      break;
    }

    kept += character;
  }

  return kept.trimEnd();
};

/**
 * Where a film or episode is filed, named so the library's scanner reads it without guessing: a
 * film as its title and year inside its folder, and an episode inside the folder the library keeps
 * its season in, or a folder of its own for a season it does not hold, as the series' folder is
 * named, its season and episode — or the first and last of several one file holds — and its own
 * title, each followed by what this copy of it is,
 * which goes on the file and never on the folder around it. An episode title too long for the name
 * to fit the 255 bytes a disk allows, with room for the mark it wears while it is checked, is cut
 * short to fit, so a sketch show whose episodes are five titles long still files. A film's further version is named as
 * Jellyfin names one, its quality set off by a dash, so the two are read as versions of one film.
 *
 * @param request - The request.
 * @param item - The film or episode.
 * @param extension - The file's extension, without its dot.
 * @param quality - What this copy is, as `qualityTagOf` gives it; empty where nothing is known.
 * @param lastEpisode - The last episode the file holds, where it holds several of one season, so
 *   it is named for all of them (`S01E01-E02`).
 * @returns The path.
 */
const libraryFileOf = (
  request: Pick<
    MediaRequestRecord,
    'libraryPath' | 'libraryFolder' | 'seasonFolders' | 'title' | 'year'
  >,
  item: Pick<RequestItemRecord, 'season' | 'episode' | 'title' | 'versionProfileId'>,
  extension: string,
  quality = '',
  lastEpisode: number | null = null,
): string => {
  const folder = libraryFolderOf(request);
  const name = folder.slice(folder.lastIndexOf('/') + 1);

  if (item.season === null || item.episode === null) {
    const isVersion = item.versionProfileId !== null && item.versionProfileId !== undefined;

    return join(
      folder,
      `${name}${isVersion && quality !== '' ? ` - ${quality.trim()}` : quality}.${extension}`,
    );
  }

  const numbered = `S${twoDigits(item.season)}E${twoDigits(item.episode)}${
    lastEpisode !== null && lastEpisode > item.episode ? `-E${twoDigits(lastEpisode)}` : ''
  }`;
  const around = `${name} - ${numbered} - ${quality}.${extension}${BEING_CHECKED}`;
  const episodeTitle = fittedTo(
    safeFileName(item.title),
    MOST_NAME_BYTES - new TextEncoder().encode(around).length,
  );

  return join(
    seasonFolderOf(folder, item.season, request.seasonFolders),
    `${name} - ${numbered}${episodeTitle === '' ? '' : ` - ${episodeTitle}`}${quality}.${extension}`,
  );
};

export { libraryFileOf };
