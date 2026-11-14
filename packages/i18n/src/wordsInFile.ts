import type { StringEntry } from './StringsFileSchema';

/**
 * Takes a strings file down to what a client needs to speak it: each handler's words, without the
 * notes left for translators.
 *
 * @param entries - The file's entries.
 * @returns The words by handler.
 */
const wordsInFile = (entries: readonly StringEntry[]): Record<string, string> =>
  Object.fromEntries(entries.map((entry) => [entry.handler, entry.text]));

export { wordsInFile };
