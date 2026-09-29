/**
 * Joins a few words the way a sentence would: "a", "a and b", "a, b and c".
 *
 * @param words - What to join.
 * @returns The joined phrase.
 */
const listInWords = (words: readonly string[]): string =>
  words.length <= 1
    ? (words[0] ?? '')
    : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1] ?? ''}`;

export { listInWords };
