import { relative, sep } from 'node:path';
import { seriesFromPath } from '@ValenceServer/books/seriesFromPath';

/**
 * Who wrote a book, as its folders say where its files do not: the folder its book sits in,
 * `Author/Title`, or above its series, `Author/Series/1 - Title`. Nothing for a book directly in
 * the library, or one whose only folder above it is a series, `Series/1 - Title`.
 *
 * @param root - Where the library is.
 * @param bookPath - Where the book is.
 * @returns The author, or null.
 */
const authorFromPath = (root: string, bookPath: string): string | null => {
  const parts = relative(root, bookPath)
    .split(sep)
    .filter((part) => part !== '' && part !== '.');
  const [top] = parts;

  if (top === undefined || top === '..' || parts.length < 2) {
    return null;
  }

  return parts.length >= 3 || seriesFromPath(root, bookPath) === null ? top : null;
};

export { authorFromPath };
