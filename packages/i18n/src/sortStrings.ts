import type { StringEntry } from './StringsFileSchema';

/**
 * The English strings in handler order, which is the order every strings file keeps.
 *
 * @param english - The English strings file.
 */
const sortStrings = (english: readonly StringEntry[]): StringEntry[] =>
  [...english].sort((left, right) => left.handler.localeCompare(right.handler, 'en'));

export { sortStrings };
