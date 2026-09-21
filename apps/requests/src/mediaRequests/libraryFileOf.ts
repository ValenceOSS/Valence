import { join } from 'node:path';
import { libraryFolderOf } from '@ValenceRequests/mediaRequests/libraryFolderOf';
import { safeFileName } from '@ValenceRequests/mediaRequests/safeFileName';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

/**
 * Two digits at least, as seasons and episodes are numbered in names.
 *
 * @param value - The number.
 * @returns It padded.
 */
const twoDigits = (value: number): string => value.toString().padStart(2, '0');

/**
 * Where a film or episode is filed, named so the library's scanner reads it without guessing: a
 * film as its title and year inside its folder, and an episode inside a folder for its season, as
 * the series, its season and episode, and its own title — each followed by what this copy of it is,
 * which goes on the file and never on the folder around it.
 *
 * @param request - The request.
 * @param item - The film or episode.
 * @param extension - The file's extension, without its dot.
 * @param quality - What this copy is, as `qualityTagOf` gives it; empty where nothing is known.
 * @returns The path.
 */
const libraryFileOf = (
  request: Pick<MediaRequestRecord, 'libraryPath' | 'title' | 'year'>,
  item: Pick<RequestItemRecord, 'season' | 'episode' | 'title'>,
  extension: string,
  quality = '',
): string => {
  const folder = libraryFolderOf(request);
  const name = folder.slice(folder.lastIndexOf('/') + 1);

  if (item.season === null || item.episode === null) {
    return join(folder, `${name}${quality}.${extension}`);
  }

  const numbered = `S${twoDigits(item.season)}E${twoDigits(item.episode)}`;
  const episodeTitle = safeFileName(item.title);

  return join(
    folder,
    `Season ${twoDigits(item.season)}`,
    `${name} - ${numbered}${episodeTitle === '' ? '' : ` - ${episodeTitle}`}${quality}.${extension}`,
  );
};

export { libraryFileOf };
