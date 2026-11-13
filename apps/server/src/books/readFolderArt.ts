import { lstat, readdir, readFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import type { BookPageBytes } from './BookFile';

const FOLDER_ART = /^(cover|folder|front|poster)\.(jpe?g|png|webp)$/i;

const MOST_ART_BYTES = 32 * 1024 * 1024;

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

/**
 * The picture a book's folder keeps beside its files — a cover, folder or front image, as an
 * audiobook's download usually brings one — for a book with nothing inside its files to show.
 *
 * @param bookPath - The book's folder, or its one file where it stands alone.
 * @param isFolder - Whether the path is the book's folder rather than a file of its own.
 * @returns The picture, or nothing where the folder keeps none. A link is not a picture, and neither
 *   is a file larger than any cover is, so a link planted in a folder reaches nothing.
 */
const readFolderArt = async (
  bookPath: string,
  isFolder: boolean,
): Promise<BookPageBytes | null> => {
  const folder = isFolder ? bookPath : dirname(bookPath);
  const names = await readdir(folder).catch(() => []);
  const found = names.find((name) => FOLDER_ART.test(name));

  if (found === undefined) {
    return null;
  }

  const at = join(folder, found);
  const kept = await lstat(at).catch(() => null);

  if (kept === null || !kept.isFile() || kept.size > MOST_ART_BYTES) {
    return null;
  }

  const bytes = await readFile(at).catch(() => null);

  return bytes === null
    ? null
    : {
        bytes: new Uint8Array(bytes),
        contentType: CONTENT_TYPES[extname(found).toLowerCase()] ?? 'image/jpeg',
      };
};

export { readFolderArt };
