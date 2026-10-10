/**
 * Whether the letters of a word appear in this order within the text, with anything between them.
 *
 * @param word - What was typed.
 * @param text - What it is looked for in.
 * @returns Whether every letter is found in turn.
 */
const isInOrder = (word: string, text: string): boolean => {
  let at = 0;

  for (const letter of word) {
    at = text.indexOf(letter, at);

    if (at === -1) {
      return false;
    }

    at += 1;
  }

  return true;
};

/**
 * How well something typed matches a name, forgivingly: every word typed must be found, best at the
 * start of a word of the name, then anywhere inside one, then as its letters in order — so "add",
 * "download client" and "dl clnt" all find "Add a download client".
 *
 * @param query - What was typed.
 * @param text - The name, with anything else it may be found by.
 * @returns A score, higher for a closer match, or null where a word typed is not found at all.
 */
const fuzzyScore = (query: string, text: string): number | null => {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word !== '');
  const haystack = text.toLowerCase();
  const names = haystack.split(/[^\p{L}\p{N}]+/u).filter((name) => name !== '');

  let score = 0;

  for (const word of words) {
    if (names[0]?.startsWith(word) === true) {
      score += 4;
    } else if (names.some((name) => name.startsWith(word))) {
      score += 3;
    } else if (haystack.includes(word)) {
      score += 2;
    } else if (isInOrder(word, haystack)) {
      score += 1;
    } else {
      return null;
    }
  }

  return score;
};

export { fuzzyScore };
