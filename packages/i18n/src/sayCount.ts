import { countedHandler } from './countedHandler';
import { fillGaps } from './fillGaps';
import { SPOKEN } from './SPOKEN';
import type { CountedKey } from './CountedKey';

/**
 * Says how many of something there are, in the form the language uses for that many — one film,
 * two films — with the number itself filling `{count}`.
 *
 * @param key - Which words, without the `.one` or `.other` on the end.
 * @param count - How many.
 * @param values - What fills any other gaps.
 * @returns The words, filled in.
 */
const sayCount = (
  key: CountedKey,
  count: number,
  values: Readonly<Record<string, string | number>> = {},
): string =>
  fillGaps(SPOKEN.words[countedHandler(key, count)] ?? key, {
    ...values,
    count: count.toLocaleString(SPOKEN.language),
  });

export { sayCount };
