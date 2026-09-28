import { BOOK_FORMATS } from '@ValenceContracts/schemas/Book';
import { folderOf } from './folderOf';

/**
 * The folder a book lives in. A book is either a folder of chapters or, sitting loose in its
 * library, a single file, which its ending gives away.
 *
 * @param path - Where the book is.
 * @returns The folder to open for it.
 */
const bookFolderOf = (path: string): string => {
  const ending = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
  const isFile = path.includes('.') && BOOK_FORMATS.some((format) => format === ending);

  return isFile ? folderOf(path) : path;
};

export { bookFolderOf };
