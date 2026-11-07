const SMALL_WORDS: ReadonlySet<string> = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'but',
  'by',
  'for',
  'in',
  'nor',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
]);

/**
 * A heading from a book's contents as it reads best in a list: one set entirely in capitals, as
 * many books set them, is put in title case, so "TITLE PAGE" reads "Title Page"; one written in
 * mixed case is left as its author wrote it.
 *
 * @param title - The heading as the book gives it.
 * @returns It, readable.
 */
const readableTitle = (title: string): string => {
  if (title !== title.toUpperCase() || title === title.toLowerCase()) {
    return title;
  }

  return title
    .toLowerCase()
    .split(' ')
    .map((word, at) =>
      at > 0 && SMALL_WORDS.has(word) ? word : `${word.charAt(0).toUpperCase()}${word.slice(1)}`,
    )
    .join(' ');
};

export { readableTitle };
