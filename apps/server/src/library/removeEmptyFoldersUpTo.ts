import { rmdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { isUnderAny } from '@ValenceServer/library/isUnderAny';

/**
 * Removes the folders a file leaves empty on its way out, from its own folder upwards, stopping at
 * the first that still holds something and never reaching the library's own folder.
 *
 * @param folder - The folder the file was in.
 * @param root - The library's folder, which stays whatever is left in it.
 */
const removeEmptyFoldersUpTo = async (folder: string, root: string): Promise<void> => {
  for (let emptied = folder; emptied !== root && isUnderAny(emptied, [root]);) {
    const isGone = await rmdir(emptied).then(
      () => true,
      () => false,
    );

    if (!isGone) {
      break;
    }

    emptied = dirname(emptied);
  }
};

export { removeEmptyFoldersUpTo };
