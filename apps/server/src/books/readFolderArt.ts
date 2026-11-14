import { lstat, readdir, readFile, realpath, stat } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { isUnderAny } from '@ValenceServer/library/isUnderAny';
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
 * Where a link really leads, where that is inside the library.
 *
 * @param link - The link.
 * @param libraryPath - The library's folder.
 * @returns The file the link leads to, or nothing where it is missing or lies outside the library.
 */
const withinLibrary = async (link: string, libraryPath: string): Promise<string | null> => {
  const target = await realpath(link).catch(() => null);
  const root = await realpath(libraryPath).catch(() => null);

  return target !== null && root !== null && isUnderAny(target, [root]) ? target : null;
};

/**
 * The picture a book's folder keeps beside its files — a cover, folder or front image, as an
 * audiobook's download usually brings one — for a book with nothing inside its files to show.
 *
 * @param bookPath - The book's folder, or its one file where it stands alone.
 * @param isFolder - Whether the path is the book's folder rather than a file of its own.
 * @param libraryPath - The library's folder.
 * @returns The picture, or nothing where the folder keeps none. A link is followed only to a file
 *   inside the library, and a file larger than any cover is not read, so a link planted in a folder
 *   reaches nothing outside it.
 */
const readFolderArt = async (
  bookPath: string,
  isFolder: boolean,
  libraryPath: string,
): Promise<BookPageBytes | null> => {
  const folder = isFolder ? bookPath : dirname(bookPath);
  const names = await readdir(folder).catch(() => []);
  const found = names.find((name) => FOLDER_ART.test(name));

  if (found === undefined) {
    return null;
  }

  const named = join(folder, found);
  const link = await lstat(named).catch(() => null);

  if (link === null) {
    return null;
  }

  const at = link.isSymbolicLink() ? await withinLibrary(named, libraryPath) : named;

  if (at === null) {
    return null;
  }

  const kept = await stat(at).catch(() => null);

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
