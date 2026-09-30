import { sayParts } from './sayParts';
import type { CountedKey } from './CountedKey';

/**
 * Says how many of something there are, in the form the language uses for that many, with the
 * number and any other gaps filled by things other than words, such as a number that rolls.
 *
 * @param key - Which words, without the `.one` or `.other` on the end.
 * @param count - How many, which picks the form.
 * @param fillings - What fills each gap, `{count}` among them.
 * @returns The words between the gaps, and each gap's filling where it falls.
 */
const sayCountParts = <Filling>(
  key: CountedKey,
  count: number,
  fillings: Readonly<Record<string, Filling>>,
): (string | Filling)[] => sayParts(count === 1 ? `${key}.one` : `${key}.other`, fillings);

export { sayCountParts };
