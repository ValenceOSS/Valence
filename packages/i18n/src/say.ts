import values from './values-en.json';
import type { StringKey } from './StringKey';

const PLACEHOLDER = /\{(\w+)\}/gu;

const WORDS: Readonly<Record<StringKey, string>> = values;

/**
 * Says something in words from the strings file, with any `{name}` in it filled from what is given.
 *
 * A name with nothing given for it is left as written, so a missing value shows up on screen
 * rather than quietly vanishing from the sentence.
 *
 * @param key - Which words.
 * @param values - What fills the gaps in them.
 * @returns The words, filled in.
 */
const say = (key: StringKey, values: Readonly<Record<string, string | number>> = {}): string =>
  WORDS[key].replace(PLACEHOLDER, (whole, name: string) => {
    const value = values[name];

    return value === undefined ? whole : value.toString();
  });

export { say };
