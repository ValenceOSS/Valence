import { stat } from 'node:fs/promises';
import type { MediaLink } from '@ValenceContracts/schemas/MediaOrigin';

/**
 * Whether a file is a hard link it shares with somewhere else, as a file placed from a download
 * that is still seeding is, or stands alone, read from the disk as it is now.
 *
 * @param path - The file.
 * @param statFile - Reads what the disk knows of a file.
 * @returns Whether it is linked, or nothing where the file could not be read.
 */
const linkStateOf = async (
  path: string,
  statFile: (path: string) => Promise<{ nlink: number; isFile: () => boolean }> = stat,
): Promise<MediaLink | null> => {
  const found = await statFile(path).catch(() => null);

  if (found === null || !found.isFile()) {
    return null;
  }

  return found.nlink > 1 ? 'linked' : 'alone';
};

export { linkStateOf };
