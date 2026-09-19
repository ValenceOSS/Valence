import { join } from 'node:path';
import { safeFileName } from '@ValenceRequests/mediaRequests/safeFileName';

/**
 * The folder in a music library an album is filed into: its artist's folder, and in that the album
 * with its year, which is how the library's scanner groups tracks that carry no tags.
 *
 * @param libraryPath - Where the music library is.
 * @param album - The album's artist, title and year.
 * @returns The folder.
 */
const albumFolderOf = (
  libraryPath: string,
  album: { artist: string; title: string; year: number | null },
): string =>
  join(
    libraryPath,
    safeFileName(album.artist),
    `${safeFileName(album.title)}${album.year === null ? '' : ` (${album.year.toString()})`}`,
  );

export { albumFolderOf };
