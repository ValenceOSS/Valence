import { say } from './say';
import type { CountedKey } from './CountedKey';

const RULES = new Intl.PluralRules('en');

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
  say(RULES.select(count) === 'one' ? `${key}.one` : `${key}.other`, {
    ...values,
    count: count.toLocaleString('en'),
  });

export { sayCount };
