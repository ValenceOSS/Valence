const MOST_CHARACTERS = 200;

/**
 * Whether every word a caller sent to look a picture up by is short enough to be a real title,
 * name or artist.
 *
 * @param words - What was sent.
 * @returns Whether none is longer than a name can reasonably be.
 */
const isShortLookup = (...words: readonly (string | undefined)[]): boolean =>
  words.every((word) => word === undefined || word.length <= MOST_CHARACTERS);

export { isShortLookup };
