/**
 * Reads words typed into the form, separated by commas.
 *
 * @param text - What was typed.
 * @returns The words.
 */
const wordsOf = (text: string): string[] =>
  text
    .split(',')
    .map((word) => word.trim())
    .filter((word) => word !== '');

export { wordsOf };
