/**
 * The words a book is searched for by, and that a search is made of, put alike: in one form,
 * lower case, with punctuation as a space, so a title written either way is found by the other.
 *
 * @param text - What to put alike.
 * @returns The words, a space between each.
 */
const searchWordsOf = (text: string): string =>
  text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

export { searchWordsOf };
