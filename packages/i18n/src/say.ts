import { ENGLISH } from './ENGLISH';
import { GAP } from './GAP';
import type { StringKey } from './StringKey';

const WORDS: Readonly<Record<StringKey, string>> = ENGLISH;

/**
 * Says something in words from the strings file, with any `{name}` in it filled from what is given.
 *
 * A gap with nothing given for it is left as written, so a missing value shows up on screen rather
 * than quietly vanishing from the sentence.
 *
 * @param key - Which words.
 * @param values - What fills the gaps in them.
 * @returns The words, filled in.
 */
const say = (key: StringKey, values: Readonly<Record<string, string | number>> = {}): string =>
  WORDS[key].replace(GAP, (whole, name: string) => {
    const value = values[name];

    return value === undefined ? whole : value.toString();
  });

export { say };
