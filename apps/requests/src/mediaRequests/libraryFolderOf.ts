import { join } from 'node:path';
import { safeFileName } from '@ValenceRequests/mediaRequests/safeFileName';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

/**
 * The folder in its library that a film or series is filed into: the one the library already keeps
 * the series in, or else its title and year, which is where the library's scanner looks first for
 * what something is.
 *
 * @param request - The request.
 * @returns The folder.
 */
const libraryFolderOf = ({
  libraryPath,
  libraryFolder,
  title,
  year,
}: Pick<MediaRequestRecord, 'libraryPath' | 'libraryFolder' | 'title' | 'year'>): string =>
  libraryFolder ??
  join(libraryPath, `${safeFileName(title)}${year === null ? '' : ` (${year.toString()})`}`);

export { libraryFolderOf };
