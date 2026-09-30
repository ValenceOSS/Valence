import { GAP } from './GAP';
import { say } from './say';
import type { StringKey } from './StringKey';

/**
 * Says something whose gaps are filled by things other than words, such as a link inside a sentence,
 * as the run of words and fillings in the order the language puts them.
 *
 * @param key - Which words.
 * @param fillings - What fills each gap.
 * @returns The words between the gaps, and each gap's filling where it falls.
 */
const sayParts = <Filling>(
  key: StringKey,
  fillings: Readonly<Record<string, Filling>>,
): (string | Filling)[] =>
  say(key)
    .split(GAP)
    .map((part, at) => (at % 2 === 1 ? (fillings[part] ?? `{${part}}`) : part))
    .filter((part) => part !== '');

export { sayParts };
