/**
 * Reads a word the way two spellings of it are compared: in lower case, with "&" read as "and",
 * and with everything that is not a letter or a digit left out.
 *
 * @param word - The word.
 * @returns What it is compared by.
 */
const sameWord = (word: string): string =>
  word
    .toLowerCase()
    .replaceAll('&', 'and')
    .replaceAll(/[^\p{L}\p{N}]/gu, '');

export { sameWord };
