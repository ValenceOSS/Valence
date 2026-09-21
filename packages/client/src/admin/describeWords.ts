/**
 * Puts an identifier into words: `readAgain`, `read-again` and `read_again` are all "Read again".
 *
 * @param name - The identifier.
 * @returns The words, with a capital at the start, or nothing where there is nothing to make words of.
 */
const describeWords = (name: string): string => {
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll(/[-_]+/g, ' ')
    .trim()
    .toLowerCase();

  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
};

export { describeWords };
