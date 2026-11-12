import { join } from 'node:path';
import { DISK_PICTURE } from '@ValenceServer/library/DISK_PICTURE';
import { UPLOAD_PICTURE } from '@ValenceServer/library/UPLOAD_PICTURE';
import { isCleanCopy } from './isCleanCopy';

/**
 * Lets go of the copies the image cache kept of pictures from this server — ones beside a title's
 * files, or uploaded for it — before they were cleaned, so each is cleaned the next time it is asked
 * for. A copy already clean is left alone, so this can run at every start.
 *
 * @param urls - The addresses artwork is drawn from.
 * @param cache - Where the image cache keeps its copies, what it calls them, and how it lets one go.
 * @returns How many were let go.
 */
const forgetRawLocalCopies = async (
  urls: readonly (string | null)[],
  cache: {
    directory: string;
    nameFor: (url: string) => string;
    forget: (url: string) => Promise<void>;
  },
): Promise<number> => {
  let forgotten = 0;

  for (const url of new Set(urls)) {
    if (url === null || !(url.startsWith(DISK_PICTURE) || url.startsWith(UPLOAD_PICTURE))) {
      continue;
    }

    if ((await isCleanCopy(join(cache.directory, cache.nameFor(url)))) === false) {
      await cache.forget(url);
      forgotten += 1;
    }
  }

  return forgotten;
};

export { forgetRawLocalCopies };
