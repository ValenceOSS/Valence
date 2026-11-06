/**
 * Brings a title or a name down to the words in it, so that the same book written two ways — with a
 * subtitle, a leading "The", different capitals or punctuation — reads the same.
 *
 * @param text - The title or name.
 * @returns Its words, lower-cased and joined by single spaces.
 */
const wordsOf = (text: string): string =>
  text
    .split(/[:([]/u)[0]
    ?.normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/&/gu, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/^(the|a|an) /u, '')
    .trim() ?? '';

/**
 * Whether a book Open Library found is the one on the shelf: the same title once both are brought
 * down to their words, and, where the shelf knows who wrote it, an author whose surname matches. A
 * cover is only taken from a match this sure, since the wrong cover is worse than the file's own.
 *
 * @param found - What Open Library found.
 * @param found.title - Its title.
 * @param found.author - Who it names as the author, if anybody.
 * @param title - The shelf's title for the book.
 * @param authors - Who the shelf says wrote it.
 * @returns Whether they are the same book.
 */
const isSameBook = (
  found: { title: string; author: string | null },
  title: string,
  authors: readonly string[],
): boolean => {
  if (wordsOf(found.title) === '' || wordsOf(found.title) !== wordsOf(title)) {
    return false;
  }

  if (authors.length === 0) {
    return true;
  }

  const surname = wordsOf(found.author ?? '')
    .split(' ')
    .at(-1);

  return (
    surname !== undefined &&
    surname !== '' &&
    authors.some((author) => wordsOf(author).split(' ').includes(surname))
  );
};

export { isSameBook };
