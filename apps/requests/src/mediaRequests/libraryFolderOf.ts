import { join } from 'node:path';
import { safeFileName } from '@ValenceRequests/mediaRequests/safeFileName';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

/**
 * The folder in its library that a film or series is filed into: its title and year, which is
 * where the library's scanner looks first for what something is.
 *
 * @param request - The request.
 * @returns The folder.
 */
const libraryFolderOf = ({
  libraryPath,
  title,
  year,
}: Pick<MediaRequestRecord, 'libraryPath' | 'title' | 'year'>): string =>
  join(libraryPath, `${safeFileName(title)}${year === null ? '' : ` (${year.toString()})`}`);

export { libraryFolderOf };
