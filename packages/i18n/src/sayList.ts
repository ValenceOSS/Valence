import { SPOKEN } from './SPOKEN';

/**
 * Runs several names together the way the language spoken in the app does, such as "Ana, Ben and
 * Cleo", rather than the way the browser's own language would.
 *
 * @param names - What to run together, in order.
 * @returns The names as one phrase.
 */
const sayList = (names: readonly string[]): string =>
  new Intl.ListFormat(SPOKEN.language, { type: 'conjunction' }).format(names);

export { sayList };
