import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { safeFileName } from '@ValenceRequests/mediaRequests/safeFileName';

const PLACED = /^\d+(?:\.\d+)?\s*-\s*/;

/**
 * The folders directly inside a folder, or none where it cannot be read.
 *
 * @param folder - The folder.
 * @returns Their names.
 */
const foldersIn = async (folder: string): Promise<string[]> => {
  try {
    return (await readdir(folder, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
};

/**
 * Whether a folder is named for a book, with or without its place in a series before it.
 *
 * @param name - The folder's name.
 * @param title - The book's title, as filed.
 * @returns Whether it is.
 */
const isNamedFor = (name: string, title: string): boolean =>
  name.replace(PLACED, '').toLowerCase() === title.toLowerCase();

/**
 * Where a book is already kept in a library, so another copy of it — the book to read beside the
 * book to hear — joins it rather than becoming a second book: its own folder in its author's, or
 * in one of its author's series, `Author/Series/2 - Title`.
 *
 * @param libraryPath - Where the books library is.
 * @param author - Who wrote it, where known.
 * @param title - Its title.
 * @returns Its folder, or nothing where the library does not have it yet.
 */
const findBookFolder = async (
  libraryPath: string,
  author: string | null,
  title: string,
): Promise<string | null> => {
  const named = safeFileName(title);
  const within =
    author === null || safeFileName(author) === ''
      ? libraryPath
      : join(libraryPath, safeFileName(author));

  if (named === '') {
    return null;
  }

  const around = await foldersIn(within);
  const own = around.find((name) => isNamedFor(name, named));

  if (own !== undefined) {
    return join(within, own);
  }

  for (const series of around) {
    const found = (await foldersIn(join(within, series))).find((name) => isNamedFor(name, named));

    if (found !== undefined) {
      return join(within, series, found);
    }
  }

  return null;
};

export { findBookFolder };
