import { readdir, rmdir, stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { AUDIO_FILE_EXTENSIONS } from '@ValenceContracts/constants/AUDIO_FILE_EXTENSIONS';
import { BOOK_FILE_FORMATS } from '@ValenceContracts/constants/BOOK_FILE_FORMATS';
import { extensionOf } from '@ValenceRequests/mediaRequests/extensionOf';

const SIDE_FILES = /^(cover\.[a-z]+|metadata\.opf|.+\.lrc)$/iu;

/**
 * Whether a file is one Valence puts in an album's or a book's folder.
 *
 * @param name - The file's name.
 * @returns Whether it is.
 */
const isPlacedHere = (name: string): boolean =>
  AUDIO_FILE_EXTENSIONS.has(extensionOf(name)) ||
  BOOK_FILE_FORMATS.has(extensionOf(name)) ||
  SIDE_FILES.test(name);

/**
 * Deletes what a request filed: a film's or an episode's file, or the tracks, books, covers and
 * notes Valence put in an album's or a book's folder, and then the folder where that leaves it
 * empty.
 *
 * An album or a book is filed as a folder, and deleting it as though it were a file failed without
 * a word, so removing one with its files left every file on the disk. Only what lies in the folder
 * itself is deleted, never anything in a folder within it: a pack of books can be filed as the
 * folder its books share, and the other books are in folders of their own inside it.
 *
 * @param path - Where the request filed it.
 */
const deleteFiledPath = async (path: string): Promise<void> => {
  const found = await stat(path).catch(() => null);

  if (found === null) {
    return;
  }

  if (!found.isDirectory()) {
    await unlink(path).catch(() => undefined);

    return;
  }

  for (const entry of await readdir(path, { withFileTypes: true }).catch(() => [])) {
    if (entry.isFile() && isPlacedHere(entry.name)) {
      await unlink(join(path, entry.name)).catch(() => undefined);
    }
  }

  await rmdir(path).catch(() => undefined);
};

export { deleteFiledPath };
